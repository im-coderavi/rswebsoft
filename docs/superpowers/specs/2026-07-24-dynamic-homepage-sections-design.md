# Dynamic Homepage Sections — Design Spec

Date: 2026-07-24

## Problem

The homepage currently ships 7+ product-listing sections (Featured Products, Popular WordPress Plugins, Premium WordPress Themes, Ready Websites, Websites I've Built & Delivered, Handy Tools, Source Codes, SaaS Software). Each one is a **hardcoded React component** in `src/components/home/`, wired to one fixed `Product.type` value (or the `featured` flag), and manually listed in `src/pages/Home.jsx`.

Categories (`Category` model) are already fully admin-manageable (create/edit/delete via `/admin/categories`), but they are disconnected from which homepage sections exist. Adding a genuinely new homepage section today requires a developer to: add a new `type` enum value, write a new component, and edit `Home.jsx`.

Goal: let a non-technical admin fully control which sections appear on the homepage, what products populate each one, their order, and whether they're visible — with zero code changes for ordinary catalog changes (new category, new products, new section).

## Data Model

New Mongoose model `HomeSection` (`server/src/models/HomeSection.js`):

```js
{
  title: String,          // required, e.g. "Popular WordPress Plugins"
  subtitle: String,       // optional supporting text
  slug: String,           // auto-generated from title, unique (for CTA link fallback)
  layout: {
    type: String,
    enum: ["grid", "carousel", "showcase"],
    default: "grid",
  },
  selectionMode: {
    type: String,
    enum: ["auto", "manual"],
    default: "auto",
  },
  // selectionMode === "auto"
  filters: {
    category: { type: ObjectId, ref: "Category", default: null }, // null = all categories
    type: { type: String, enum: [...Product.type enum, "any"], default: "any" },
    onlyFeatured: { type: Boolean, default: false },
  },
  // selectionMode === "manual"
  manualProducts: [{ type: ObjectId, ref: "Product" }], // ordered

  maxItems: { type: Number, default: 8, min: 1, max: 48 },
  ctaLink: { type: String, default: "" }, // optional override; auto-derived if blank
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}
```

Notes:
- `filters.category` and `filters.type` are independent optional narrowing filters within `auto` mode — a section can filter by category only, type only, both, or neither (= all published products, optionally restricted to featured).
- Only `published` products are ever eligible, regardless of mode.
- Products deleted after being added to `manualProducts` are simply filtered out at read time (no cleanup job needed).

## Backend

**Model**: `server/src/models/HomeSection.js` (slug via `pre("validate")`, same pattern as `Category`/`Product`).

**Controller**: `server/src/controllers/homeSectionController.js`
- `listPublicHomeSections` — `GET /api/home-sections` (public). Returns only `isActive: true`, sorted by `order` ascending. For each section, resolves its products server-side (respecting `maxItems`, `status: published`) and populates `category`/`brand` on those products, so the frontend gets ready-to-render data in one call.
- `listAdminHomeSections` — `GET /api/home-sections/admin` (auth required). Returns all sections (active + inactive), sorted by `order`, with resolved product counts (not full product bodies) for the list view.
- `createHomeSection` — `POST /api/home-sections` (auth). New section gets `order = (max existing order) + 1`.
- `updateHomeSection` — `PUT /api/home-sections/:id` (auth).
- `deleteHomeSection` — `DELETE /api/home-sections/:id` (auth).
- `reorderHomeSections` — `PATCH /api/home-sections/reorder` (auth). Accepts `{ ids: [id, id, ...] }` in the new order; assigns `order = index` to each.

**Routes**: `server/src/routes/homeSectionRoutes.js`, mounted at `/api/home-sections`, following the existing `categoryRoutes.js` auth-middleware pattern (public GET, protected mutations).

**Category delete guard**: extend `categoryController.deleteCategory` to also reject deletion if any `HomeSection` references that category in `filters.category`, mirroring the existing "category has products" guard, with message "Category is used by a homepage section."

**Product resolution logic** (shared helper, e.g. `server/src/utils/resolveSectionProducts.js`):
- `manual`: `Product.find({ _id: { $in: manualProducts }, status: "published" })`, then re-sort results to match the stored array order, capped at `maxItems`.
- `auto`: build a filter object from `{ status: "published", ...(category && { category }), ...(type !== "any" && { type }), ...(onlyFeatured && { featured: true }) }`, sorted by `createdAt: -1`, capped at `maxItems`.

## Frontend

**Hook**: `src/hooks/useHomeSections.js` — `useHomeSections()` (public list, react-query) and admin variants (`useAdminHomeSections`, `useCreateHomeSection`, `useUpdateHomeSection`, `useDeleteHomeSection`, `useReorderHomeSections`), following the exact pattern of `src/hooks/useCategories.js`.

**Public rendering**: new `src/components/home/DynamicSection.jsx` replaces the per-type components (`FeaturedProducts`, `ReadyWebsites`, `DeliveredWebsites`, and the `TypeCarousel` helper in `Home.jsx`). It receives one resolved section object (`{ title, subtitle, layout, ctaLink, products }`) and renders:
- `layout: "grid"` — the paginated grid used today in `FeaturedProducts`/`ReadyWebsites` (reusing `ProductCard`)
- `layout: "carousel"` — reuses the existing `ProductCarousel` component as-is
- `layout: "showcase"` — reuses the existing `DeliveredWebsiteCard` grid from `DeliveredWebsites.jsx`

If a section resolves to zero products, it renders nothing (same as today's per-component behavior).

`Home.jsx` becomes:
```jsx
<Hero /> <StatsStrip /> <WhyChooseUs /> <CategoriesGrid />
{sections.map(s => <DynamicSection key={s._id} section={s} />)}
<PricingPlans /> <ClientsMarquee /> <BrandsSection /> <DemoCenter /> <Testimonials /> <Newsletter />
```
(Non-product-listing sections stay static, matching your original scope.)

**Admin UI**: new page `src/admin/pages/sections/HomeSectionList.jsx`, added to `AdminSidebar`/`navConfig` as "Homepage Sections", and routed at `/admin/sections` in `App.jsx`.
- List: reuses `DataTable`, columns = Title, Layout, Mode, Product count, Active toggle, plus ▲/▼ reorder buttons per row (calls `reorder` mutation) and Edit/Delete actions — visual pattern copied from `CategoryList.jsx`.
- Create/Edit modal:
  - Title, Subtitle (text inputs)
  - Layout (select: Grid / Carousel / Showcase)
  - Mode toggle: Auto-filter / Manually pick products
    - Auto: Category select (options = existing categories + "All Categories"), Type select (existing enum + "Any Type"), "Only featured products" checkbox
    - Manual: search box hitting the existing product search/list endpoint, click-to-add, shows selected products as a reorderable chip list (up/down arrows, remove button)
  - Max items (number input)
  - Active (toggle)

## Migration

One-off idempotent script `server/scripts/seedHomeSections.js` (run manually once via `node server/scripts/seedHomeSections.js`) that creates, if not already present, the 8 current sections as `HomeSection` documents equivalent to today's hardcoded behavior:

| Title | Layout | Filters |
|---|---|---|
| Featured Products | grid | onlyFeatured: true |
| Popular WordPress Plugins | carousel | type: plugin |
| Premium WordPress Themes | carousel | type: theme |
| Ready Websites | grid | type: ready-website |
| Websites I've Built & Delivered | showcase | type: delivered-website |
| Handy Tools | carousel | type: tool |
| Source Codes | carousel | type: source-code |
| SaaS Software | carousel | type: saas |

After this runs, the homepage renders identically to today, but every section is now editable/reorderable/toggleable from `/admin/sections`, and new categories can immediately become new sections with no code changes.

## Out of scope

- `CategoriesGrid`, `PricingPlans`, `ClientsMarquee`, `BrandsSection`, `DemoCenter`, `Testimonials`, `Newsletter` — not product-listing sections, stay static.
- Drag-and-drop reordering (using a DnD library) — up/down arrow buttons are used instead, consistent with the codebase's existing dependency footprint (no drag libraries currently in use).
- Per-section custom visual theming beyond the 3 layout choices.

## Risks / Edge Cases

- Deleting a category referenced by an active auto-section is blocked (same UX as "category has products").
- A manual section whose picked products all get deleted/unpublished resolves to an empty list and the section auto-hides — no dangling references, no error.
- Section list ordering ties: `order` is assigned sequentially on create/reorder, so ties shouldn't occur; if they do, secondary sort by `createdAt`.
