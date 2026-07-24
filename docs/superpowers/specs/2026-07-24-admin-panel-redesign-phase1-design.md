# Admin Panel Redesign — Phase 1: Design System, Shell & Dashboard

Date: 2026-07-24

## Problem

The admin panel (16 pages) works but looks ad-hoc: every list page repeats its own "flex justify-end" button row, its own modal markup, its own loading state ("Loading…" text row). The `DataTable` component has no search, filter, or sort — just a static list. The sidebar is flat grouped links with no way to jump to a page quickly now that there are 16 of them. The Dashboard is stat cards only, no quick actions or trend context.

Goal: redesign the admin panel to look and feel like a modern, professional SaaS product (Linear/Vercel/Stripe-style), and make it genuinely easy for a **non-technical** admin to operate — while keeping the codebase's existing Tailwind v4 token system (`ink-*`/`brand-*`/`cloud-*` CSS variables, dark-primary + polished light theme) rather than replacing it.

## Scope of this phase

This spec covers **Phase 1 only**: the shared design system, the sidebar/topbar shell, a new reusable `DataTable`, shared primitives (`Button`, `Badge`, `PageHeader`, `EmptyState`, `Skeleton`), the redesigned Dashboard as the flagship page, and migrating one small existing page (`CategoryList`) onto the new `DataTable`/`PageHeader`/`Button`/`Badge` primitives — proving the new system on a real search+filter+sort consumer, not just in isolation.

**Explicitly out of scope for this phase** (tracked as Phase 2+, separate specs): migrating the other 14 pages (Products, Brands, Orders, Customers, Demo Links, Subscribers, Settings, Homepage Sections, etc.) onto the new primitives. They keep working exactly as they do today until their own migration round. This split exists because trying to redesign+migrate all 16 pages in one plan would be unreviewable in one pass; Phase 1 proves the system on a flagship page plus one real list page, then each later phase applies it to a batch of the remaining pages using the now-validated components.

## Design Direction (validated via visual review + market research)

- **Style**: Clean SaaS — neutral base, generous whitespace, `rounded-2xl` cards, one accent color (existing indigo `brand-gradient`) reserved for primary actions/status. This matches the 2026 SaaS dashboard consensus (Stripe/Linear/Vercel/Notion): show the one number that matters first, restrained color, larger card radii over cramped density.
- **Icons**: lucide-react only, everywhere — no emoji, consistent with the existing codebase convention.
- **Theme**: keep the existing dark-primary / light-polished token system in `src/index.css` (`--ink-*`, `--brand-*`, `--cloud-*`) unchanged. No new color palette — reuse what exists.
- **Density**: "Comfortable" table rows (not compact) — prioritizes readability for a non-technical operator over cramming more rows on screen.

## Component-by-Component Design

### 1. Sidebar (`AdminSidebar.jsx` — modify)

- Add a search input at the top of the nav (`<input placeholder="Search menu...">`). Typing filters the visible links across all groups in real time (simple case-insensitive substring match on link label); non-matching groups collapse to nothing; if the query is empty, full nav shows as normal.
- Each group label (`OVERVIEW`, `CATALOG`, `SALES`, `HOMEPAGE`, `SITE CONTENT`, `SETTINGS`) becomes a clickable toggle (chevron icon from lucide, rotates on toggle) that expands/collapses that group's links.
- Collapsed/expanded state per group persists in `localStorage` (key `rs_admin_sidebar_state`) so it survives page reloads and navigation.
- Active-link highlighting (existing `bg-brand-gradient` treatment) unchanged.
- No visual changes to the topbar (`AdminTopbar.jsx`) in this phase — it already matches the clean-SaaS aesthetic reasonably well (title, view-site link, user chip, logout).

### 2. `PageHeader` (new: `src/admin/components/PageHeader.jsx`)

Every list page currently repeats:
```jsx
<div className="mb-5 flex justify-end">
  <button className="...">+ New X</button>
</div>
```
Replace with one shared component:
```jsx
<PageHeader
  title="Products"
  description="Manage every product in your catalog."
  action={{ label: "New Product", onClick: openCreate, icon: Plus }}
/>
```
Renders a title + optional description on the left, and a primary gradient button (via the new `Button` component) on the right when `action` is passed. Supports omitting `action` for pages with no create flow (e.g. Settings). This phase only builds the component and wires it into Dashboard's header area — full migration of every list page's header to `PageHeader` happens in Phase 2.

### 3. `Button` (new: `src/admin/components/Button.jsx`)

Single component replacing the repeated inline button className strings, with variants:
- `variant="primary"` — `bg-brand-gradient` (today's "New X" button style)
- `variant="secondary"` — bordered, transparent background (today's "Cancel" style)
- `variant="ghost"` — icon-only, hover background (today's row-action icon buttons)
- `variant="danger"` — rose-tinted (today's delete-icon hover style)

Props: `variant`, `icon` (lucide component), `loading` (shows a spinner + disables), standard button props pass through.

### 4. `Badge` (new: `src/admin/components/Badge.jsx`)

Replaces ad-hoc pill styling (e.g. the Active/Hidden toggle badge in `HomeSectionList.jsx`, order-status pills). Props: `tone` (`"success"|"neutral"|"danger"|"warning"|"brand"`), children. Renders `rounded-full px-2.5 py-1 text-xs font-semibold` with tone-mapped colors reusing existing Tailwind color classes (emerald/rose/amber/cloud/brand).

### 5. `EmptyState` (new: `src/admin/components/EmptyState.jsx`)

Replaces the plain `emptyMessage` text row in `DataTable`. Props: `icon` (lucide component), `title`, `description`, optional `action`. Used as `DataTable`'s empty-state renderer (see below).

### 6. `Skeleton` (new: `src/admin/components/Skeleton.jsx`)

A pulsing placeholder block (`animate-pulse bg-ink-800 rounded`) used by `DataTable` for its loading state instead of a plain "Loading…" text row — renders a few skeleton rows shaped like the real table rows.

### 7. `DataTable` v2 (modify: `src/admin/components/DataTable.jsx`)

New props, additive and backward-compatible (existing callers that don't pass the new props keep working unchanged, since this phase does not migrate other pages):
- `searchable` (bool) + `searchKeys` (array of row keys to match against) — renders a search input above the table; filters rows client-side by substring match across the given keys.
- `filters` (array of `{ key, label, options: [{value, label}] }`) — renders a row of dropdown filters above the table; each selected filter narrows rows by exact match on `row[key]`.
- `sortable` (bool) — clicking a column header (for columns with `sortable: true` in their column def) toggles ascending/descending sort on that column's raw value.
- Loading state now renders `Skeleton` rows instead of a text row.
- Empty state now renders `EmptyState` (using `emptyMessage` as its `title` if no richer config passed) instead of a text row.
- Row height increases slightly (`py-3` → `py-3.5`) per the "Comfortable" density decision.

This is the component Phase 2 will wire the new search/filter/sort props into on every other list page. This phase proves it on one real consumer: `CategoryList` (see below).

### 8.5 `CategoryList` migration (modify: `src/admin/pages/categories/CategoryList.jsx`)

Smallest, simplest existing list page (name/slug/product-count columns, one modal form) — ideal proof case:
- Replace its "New Category" button row with `PageHeader` (title "Categories", description "Organize your catalog into browsable categories.", action wired to `openCreate`).
- Replace the inline "New/Edit Category" and "Delete" buttons with the new `Button` component (`variant="primary"`/`"ghost"`/`"danger"` as appropriate).
- Pass `searchable searchKeys={["name", "slug"]}` to `DataTable` so the admin can type to filter categories by name/slug.
- No filter dropdowns needed here (categories have no status/type field to filter by) — `filters` prop simply omitted, proving it's optional.
- Mark the "Products" column `sortable: true` so clicking it sorts categories by product count (useful for finding empty categories to clean up).
- No change to its create/edit modal form (that's a separate, larger concern — modal-form redesign is Phase 2+).

### 8. Dashboard (modify: `src/admin/pages/Dashboard.jsx`) — flagship page

- Add a `PageHeader` at the top: title "Dashboard", description "Overview of your catalog and activity." (replacing the current bare `<p>`).
- Keep the existing 3 clusters (Catalog/Sales/Site Content) of stat cards, same data source (`useDashboardStats`).
- Each `StatCard` gains a small trend indicator: an up/down lucide arrow (`ArrowUp`/`ArrowDown`, emerald/rose tinted) next to the value, only rendered when the stats payload includes a `<key>Trend` field (e.g. `productsTrend: 4.2`). If the field is absent (current API doesn't provide it), the arrow is simply omitted — no fake data, no placeholder numbers. This keeps the phase honest: the *capability* ships now, real trend data is a separate backend concern noted as a follow-up, not faked in the UI.
- Add a "Quick Actions" section below the stat clusters: 3 buttons (using the new `Button` component, `variant="secondary"`, each with an icon) — "Add Product" → `/admin/products/new`, "New Homepage Section" → `/admin/sections`, "New Category" → `/admin/categories`. Plain `<Link>`-wrapped buttons, no modals.

## Data Flow

No backend changes in this phase. `useDashboardStats` (existing hook) is unchanged — the Dashboard simply renders trend arrows conditionally based on whatever fields happen to be present, so this phase ships safely regardless of whether a future backend change adds trend fields.

## Error Handling / Edge Cases

- Sidebar search with no matches: show a small "No matching pages" text row instead of an empty blank nav.
- `localStorage` unavailable (private browsing edge case): sidebar group collapse state falls back to "always expanded" (wrap the `localStorage` read/write in a try/catch, default to expanded on failure) rather than crashing.
- `DataTable` search/filter/sort operate client-side on already-fetched rows (matching the existing pattern where list pages fetch a full page of data via react-query) — no new API params needed for this phase since no page consumes these props yet.

## Testing

This repo has no automated test framework (confirmed: no Jest/Vitest, no `*.test.js` files, no `test` script in either `package.json`). Verification for this phase is: `vite build` after each component, then a manual browser walkthrough covering — sidebar search filters correctly, group collapse persists across a reload, Dashboard renders stat cards + trend arrows (or omits them cleanly) + quick actions that navigate correctly, and on `/admin/categories`: typing in the search box filters rows by name/slug, clicking the "Products" column header sorts ascending/descending, and create/edit/delete still work exactly as before.

## Out of Scope (Phase 2+)

- Migrating `ProductList`, `OrderList`, `BrandList`, `CustomerList`, `DemoLinkList`, `SubscriberList`, `HomeSectionList`, `TypedProductList`, `DeliveredWebsiteList`, `PackageList` onto `PageHeader`/`Button`/`Badge`/`DataTable` v2's search/filter/sort.
- `ProductForm` redesign (420 lines, large form — its own dedicated phase).
- `Settings`, `Login`, `CustomerDetail` redesign.
- Real trend-data backend support for Dashboard stat cards.
- Any topbar redesign.
