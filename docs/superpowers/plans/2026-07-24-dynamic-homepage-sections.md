# Dynamic Homepage Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a non-technical admin create, edit, reorder, hide, and populate homepage product sections from the admin panel, with zero code changes required for ordinary catalog changes.

**Architecture:** A new `HomeSection` Mongoose model + REST API drives a single generic `DynamicSection` React component on the homepage (replacing per-type hardcoded components), and a new admin CRUD page manages section content, filters, and order.

**Tech Stack:** Express + Mongoose (backend), React 19 + react-query + react-router (frontend), Tailwind for styling. No test framework exists in this repo (no Jest/Vitest/Mocha, no `*.test.js` files) — verification steps below use `curl` against the running dev server and manual browser checks instead of automated tests, matching the codebase's existing (test-free) conventions.

## Global Constraints

- Follow existing file/code patterns exactly: controllers use `asyncHandler`/`ApiError` (see `server/src/controllers/categoryController.js`), routes use `protect`/`adminOnly` from `server/src/middleware/auth.js`, models use `slugify` from `server/src/utils/slugify.js` with a `pre("validate")` hook.
- Frontend hooks follow the `useCategories.js` / `useProducts.js` pattern exactly: react-query `useQuery`/`useMutation`, `api` from `src/lib/api.js`, cache invalidation via `qc.invalidateQueries`.
- Admin UI follows `CategoryList.jsx`'s visual/structural pattern: `DataTable`, `ConfirmDialog`, inline modal forms, `toast` from `react-hot-toast`, `apiErrorMessage` from `src/lib/api.js`.
- Only `status: "published"` products are ever eligible for any section, regardless of selection mode.
- No new npm dependencies (no drag-and-drop library) — reordering uses up/down buttons.

---

### Task 1: `HomeSection` model

**Files:**
- Create: `server/src/models/HomeSection.js`

**Interfaces:**
- Produces: `HomeSection` Mongoose model with fields `title`, `subtitle`, `slug`, `layout` (`"grid"|"carousel"|"showcase"`), `selectionMode` (`"auto"|"manual"`), `filters.category` (ObjectId|null), `filters.type` (string enum incl. `"any"`), `filters.onlyFeatured` (bool), `manualProducts` (ObjectId array), `maxItems` (Number), `ctaLink` (String), `order` (Number), `isActive` (bool).

- [ ] **Step 1: Create the model file**

```js
import mongoose from "mongoose"
import { slugify } from "../utils/slugify.js"

const filtersSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    type: {
      type: String,
      enum: ["any", "plugin", "theme", "ready-website", "delivered-website", "package", "saas", "source-code", "tool", "other"],
      default: "any",
    },
    onlyFeatured: { type: Boolean, default: false },
  },
  { _id: false }
)

const homeSectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    slug: { type: String, unique: true },
    layout: { type: String, enum: ["grid", "carousel", "showcase"], default: "grid" },
    selectionMode: { type: String, enum: ["auto", "manual"], default: "auto" },
    filters: { type: filtersSchema, default: () => ({}) },
    manualProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    maxItems: { type: Number, default: 8, min: 1, max: 48 },
    ctaLink: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

homeSectionSchema.pre("validate", function (next) {
  if (this.isNew || this.isModified("title")) {
    this.slug = `${slugify(this.title)}-${Date.now().toString(36)}`
  }
  next()
})

export default mongoose.model("HomeSection", homeSectionSchema)
```

- [ ] **Step 2: Verify the model loads without a DB connection**

Run (from repo root):
```bash
cd server && node --input-type=module -e "import HomeSection from './src/models/HomeSection.js'; console.log(Object.keys(HomeSection.schema.paths))"
```
Expected output includes: `title`, `subtitle`, `slug`, `layout`, `selectionMode`, `filters`, `manualProducts`, `maxItems`, `ctaLink`, `order`, `isActive` (no errors/stack traces).

- [ ] **Step 3: Commit**

```bash
git add server/src/models/HomeSection.js
git commit -m "feat: add HomeSection model"
```

---

### Task 2: Product resolution helper

**Files:**
- Create: `server/src/utils/resolveSectionProducts.js`

**Interfaces:**
- Consumes: `HomeSection` document shape from Task 1 (`selectionMode`, `filters.category`, `filters.type`, `filters.onlyFeatured`, `manualProducts`, `maxItems`).
- Produces: `resolveSectionProducts(section): Promise<Product[]>` — an ordered, capped, populated array of published `Product` documents. Used by Task 3's controller.

- [ ] **Step 1: Create the helper**

```js
import Product from "../models/Product.js"

export async function resolveSectionProducts(section) {
  if (section.selectionMode === "manual") {
    const ids = section.manualProducts || []
    if (ids.length === 0) return []

    const products = await Product.find({ _id: { $in: ids }, status: "published" })
      .populate("category", "name slug icon tone")
      .populate("brand", "name slug")

    const byId = new Map(products.map((p) => [String(p._id), p]))
    return ids
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .slice(0, section.maxItems)
  }

  const filter = { status: "published" }
  if (section.filters?.category) filter.category = section.filters.category
  if (section.filters?.type && section.filters.type !== "any") filter.type = section.filters.type
  if (section.filters?.onlyFeatured) filter.featured = true

  return Product.find(filter)
    .populate("category", "name slug icon tone")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 })
    .limit(section.maxItems)
}
```

- [ ] **Step 2: Verify syntax loads cleanly**

Run:
```bash
cd server && node --input-type=module -e "import { resolveSectionProducts } from './src/utils/resolveSectionProducts.js'; console.log(typeof resolveSectionProducts)"
```
Expected output: `function`

- [ ] **Step 3: Commit**

```bash
git add server/src/utils/resolveSectionProducts.js
git commit -m "feat: add resolveSectionProducts helper"
```

---

### Task 3: `homeSectionController.js`

**Files:**
- Create: `server/src/controllers/homeSectionController.js`

**Interfaces:**
- Consumes: `HomeSection` model (Task 1), `resolveSectionProducts` (Task 2), `asyncHandler` (`server/src/utils/asyncHandler.js`), `ApiError` (`server/src/utils/apiError.js`).
- Produces: `listPublicHomeSections`, `listAdminHomeSections`, `createHomeSection`, `updateHomeSection`, `deleteHomeSection`, `reorderHomeSections` — consumed by Task 4's routes.

- [ ] **Step 1: Create the controller**

```js
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import HomeSection from "../models/HomeSection.js"
import { resolveSectionProducts } from "../utils/resolveSectionProducts.js"

export const listPublicHomeSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find({ isActive: true }).sort({ order: 1, createdAt: 1 })

  const resolved = await Promise.all(
    sections.map(async (section) => ({
      _id: section._id,
      title: section.title,
      subtitle: section.subtitle,
      slug: section.slug,
      layout: section.layout,
      ctaLink: section.ctaLink,
      products: await resolveSectionProducts(section),
    }))
  )

  res.json(resolved)
})

export const listAdminHomeSections = asyncHandler(async (req, res) => {
  const sections = await HomeSection.find()
    .sort({ order: 1, createdAt: 1 })
    .populate("filters.category", "name slug")
    .populate("manualProducts", "name slug")

  const withCounts = await Promise.all(
    sections.map(async (section) => ({
      ...section.toObject(),
      productCount: (await resolveSectionProducts(section)).length,
    }))
  )

  res.json(withCounts)
})

export const createHomeSection = asyncHandler(async (req, res) => {
  const last = await HomeSection.findOne().sort({ order: -1 })
  const order = last ? last.order + 1 : 0
  const section = await HomeSection.create({ ...req.body, order })
  res.status(201).json(section)
})

export const updateHomeSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findById(req.params.id)
  if (!section) throw new ApiError(404, "Section not found")

  Object.assign(section, req.body)
  await section.save()
  res.json(section)
})

export const deleteHomeSection = asyncHandler(async (req, res) => {
  const section = await HomeSection.findByIdAndDelete(req.params.id)
  if (!section) throw new ApiError(404, "Section not found")
  res.json({ message: "Section deleted" })
})

export const reorderHomeSections = asyncHandler(async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "ids array is required")

  await Promise.all(ids.map((id, index) => HomeSection.updateOne({ _id: id }, { order: index })))

  const sections = await HomeSection.find().sort({ order: 1, createdAt: 1 })
  res.json(sections)
})
```

- [ ] **Step 2: Verify syntax loads cleanly**

Run:
```bash
cd server && node --input-type=module -e "import * as c from './src/controllers/homeSectionController.js'; console.log(Object.keys(c))"
```
Expected output: `[ 'listPublicHomeSections', 'listAdminHomeSections', 'createHomeSection', 'updateHomeSection', 'deleteHomeSection', 'reorderHomeSections' ]`

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/homeSectionController.js
git commit -m "feat: add homeSectionController"
```

---

### Task 4: Routes + mount in `app.js`

**Files:**
- Create: `server/src/routes/homeSectionRoutes.js`
- Modify: `server/src/app.js:15` (add import), `server/src/app.js:36` (add mount)

**Interfaces:**
- Consumes: controller exports from Task 3, `protect`/`adminOnly` from `server/src/middleware/auth.js`.
- Produces: `/api/home-sections` REST endpoints, live once `app.js` mounts the router.

- [ ] **Step 1: Create the routes file**

```js
import { Router } from "express"
import {
  listPublicHomeSections,
  listAdminHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  reorderHomeSections,
} from "../controllers/homeSectionController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", listPublicHomeSections)
router.get("/admin", protect, adminOnly, listAdminHomeSections)
router.post("/", protect, adminOnly, createHomeSection)
router.patch("/reorder", protect, adminOnly, reorderHomeSections)
router.put("/:id", protect, adminOnly, updateHomeSection)
router.delete("/:id", protect, adminOnly, deleteHomeSection)

export default router
```

- [ ] **Step 2: Mount the router in `app.js`**

In `server/src/app.js`, change line 15 from:
```js
import subscriberRoutes from "./routes/subscriberRoutes.js"
```
to:
```js
import subscriberRoutes from "./routes/subscriberRoutes.js"
import homeSectionRoutes from "./routes/homeSectionRoutes.js"
```

And change line 36 from:
```js
app.use("/api/subscribers", subscriberRoutes)
```
to:
```js
app.use("/api/subscribers", subscriberRoutes)
app.use("/api/home-sections", homeSectionRoutes)
```

- [ ] **Step 3: Start the dev server and verify the public endpoint**

Run (in one terminal, from `server/`):
```bash
npm run dev
```
In another terminal:
```bash
curl -s http://localhost:5000/api/home-sections
```
(Adjust the port to whatever `server/.env`'s `PORT` is set to if not 5000.)
Expected output: `[]` (empty array — no sections exist yet), HTTP 200, no server crash in the first terminal's logs.

- [ ] **Step 4: Verify the admin endpoint requires auth**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/home-sections/admin
```
Expected output: `401`

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/homeSectionRoutes.js server/src/app.js
git commit -m "feat: add home-sections routes"
```

---

### Task 5: Block category deletion when used by a section

**Files:**
- Modify: `server/src/controllers/categoryController.js`

**Interfaces:**
- Consumes: `HomeSection` model (Task 1).

- [ ] **Step 1: Add the import and guard**

In `server/src/controllers/categoryController.js`, change:
```js
import Category from "../models/Category.js"
import Product from "../models/Product.js"
```
to:
```js
import Category from "../models/Category.js"
import Product from "../models/Product.js"
import HomeSection from "../models/HomeSection.js"
```

Then change `deleteCategory` from:
```js
export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ category: req.params.id })
  if (inUse) throw new ApiError(409, "Cannot delete a category that has products")

  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) throw new ApiError(404, "Category not found")
  res.json({ message: "Category deleted" })
})
```
to:
```js
export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.exists({ category: req.params.id })
  if (inUse) throw new ApiError(409, "Cannot delete a category that has products")

  const usedBySection = await HomeSection.exists({ "filters.category": req.params.id })
  if (usedBySection) throw new ApiError(409, "Category is used by a homepage section")

  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) throw new ApiError(404, "Category not found")
  res.json({ message: "Category deleted" })
})
```

- [ ] **Step 2: Verify syntax loads cleanly**

Run:
```bash
cd server && node --input-type=module -e "import * as c from './src/controllers/categoryController.js'; console.log(typeof c.deleteCategory)"
```
Expected output: `function`

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/categoryController.js
git commit -m "feat: block category deletion when used by a homepage section"
```

---

### Task 6: Migration script for existing sections

**Files:**
- Create: `server/scripts/seedHomeSections.js`
- Modify: `server/package.json` (add script entry)

**Interfaces:**
- Consumes: `connectDB` (`server/src/config/db.js`), `HomeSection` model (Task 1).

- [ ] **Step 1: Create the migration script**

```js
import "dotenv/config"
import { connectDB } from "../src/config/db.js"
import HomeSection from "../src/models/HomeSection.js"

const sections = [
  { title: "Featured Products", subtitle: "Hand-picked, top-rated across every category", layout: "grid", filters: { onlyFeatured: true } },
  { title: "Popular WordPress Plugins", layout: "carousel", filters: { type: "plugin" } },
  { title: "Premium WordPress Themes", layout: "carousel", filters: { type: "theme" } },
  { title: "Ready Websites", layout: "grid", filters: { type: "ready-website" } },
  {
    title: "Websites I've Built & Delivered",
    subtitle: "Professional e-commerce websites with responsive design, fast performance, and seamless shopping experience.",
    layout: "showcase",
    filters: { type: "delivered-website" },
  },
  { title: "Handy Tools", layout: "carousel", filters: { type: "tool" } },
  { title: "Source Codes", layout: "carousel", filters: { type: "source-code" } },
  { title: "SaaS Software", layout: "carousel", filters: { type: "saas" } },
]

async function run() {
  await connectDB()

  for (let i = 0; i < sections.length; i++) {
    const def = sections[i]
    const exists = await HomeSection.findOne({ title: def.title })
    if (exists) {
      console.log(`Skipping "${def.title}" — already exists`)
      continue
    }
    await HomeSection.create({ ...def, order: i, maxItems: def.layout === "showcase" ? 6 : 8 })
    console.log(`Created "${def.title}"`)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Add the npm script**

In `server/package.json`, change:
```json
    "seed": "node src/seed.js",
```
to:
```json
    "seed": "node src/seed.js",
    "seed-sections": "node scripts/seedHomeSections.js",
```

- [ ] **Step 3: Run it against the dev database and verify**

Run:
```bash
cd server && npm run seed-sections
```
Expected output: 8 lines of `Created "..."` (or `Skipping "..."` on a second run), then the process exits cleanly (no stack trace).

Then verify via the API (with the dev server from Task 4 still running):
```bash
curl -s http://localhost:5000/api/home-sections | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).map(s=>s.title)))"
```
Expected output: an array of the 8 titles above, in order.

- [ ] **Step 4: Commit**

```bash
git add server/scripts/seedHomeSections.js server/package.json
git commit -m "feat: add migration script for default homepage sections"
```

---

### Task 7: `useHomeSections` frontend hooks

**Files:**
- Create: `src/hooks/useHomeSections.js`

**Interfaces:**
- Consumes: `api` from `src/lib/api.js`.
- Produces: `useHomeSections()`, `useAdminHomeSections()`, `useCreateHomeSection()`, `useUpdateHomeSection()`, `useDeleteHomeSection()`, `useReorderHomeSections()` — consumed by Task 10 (`Home.jsx`) and Task 12 (admin page).

- [ ] **Step 1: Create the hooks file**

```js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useHomeSections() {
  return useQuery({
    queryKey: ["home-sections"],
    queryFn: async () => (await api.get("/home-sections")).data,
  })
}

export function useAdminHomeSections() {
  return useQuery({
    queryKey: ["home-sections", "admin"],
    queryFn: async () => (await api.get("/home-sections/admin")).data,
  })
}

export function useCreateHomeSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post("/home-sections", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}

export function useUpdateHomeSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/home-sections/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}

export function useDeleteHomeSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/home-sections/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}

export function useReorderHomeSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids) => (await api.patch("/home-sections/reorder", { ids })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-sections"] }),
  })
}
```

- [ ] **Step 2: Verify it builds**

Run (from repo root):
```bash
npx vite build --mode development 2>&1 | tail -30
```
Expected: build completes without errors mentioning `useHomeSections.js` (pre-existing unrelated warnings, if any, are fine).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useHomeSections.js
git commit -m "feat: add useHomeSections frontend hooks"
```

---

### Task 8: Extract `DeliveredWebsiteCard` into its own file

**Files:**
- Create: `src/components/home/DeliveredWebsiteCard.jsx`
- Modify: `src/components/home/DeliveredWebsites.jsx`

This makes the "showcase" card reusable by the new generic `DynamicSection` component (Task 9) without duplicating ~110 lines of markup.

**Interfaces:**
- Produces: default export `DeliveredWebsiteCard({ product })` — consumed by Task 9.

- [ ] **Step 1: Create `DeliveredWebsiteCard.jsx`** with the card function currently defined inline in `DeliveredWebsites.jsx` (lines 8–126):

```jsx
import { ExternalLink, CheckCircle2, Eye, Globe } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cleanText } from "../../lib/text"

export default function DeliveredWebsiteCard({ product }) {
  const navigate = useNavigate()
  const demoUrl = product.demoUrl || (product.slug ? `/products/${product.slug}?preview=true` : "#")
  const isExternal = demoUrl.startsWith("http://") || demoUrl.startsWith("https://")

  // Show max 3-4 points max as requested
  const highlights = (product.features || []).slice(0, 4)

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5">
      
      {/* Browser Window Mockup */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-ink-800 border border-white/5 shadow-inner">
        
        {/* Browser Top Bar */}
        <div className="flex items-center gap-1.5 bg-ink-950/80 px-3 py-2 border-b border-white/5">
          <div className="h-2 w-2 rounded-full bg-rose-500/80" />
          <div className="h-2 w-2 rounded-full bg-amber-500/80" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <div className="ml-2 flex h-4 flex-1 items-center rounded bg-ink-850/60 px-2 text-[9px] text-cloud-400 truncate select-none font-mono">
            {product.demoUrl ? product.demoUrl.replace(/^https?:\/\//, "") : product.name.toLowerCase()}
          </div>
        </div>

        {/* Website Image Preview */}
        <div className="relative h-[calc(100%-24px)] w-full overflow-hidden bg-ink-950">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="h-full w-full object-cover object-top transition-all duration-[3000ms] ease-in-out group-hover:object-bottom"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-gradient-soft text-brand-300 font-bold text-xs select-none">
              <Globe size={18} className="mr-1.5" /> Website Preview
            </div>
          )}

          {/* Clickable Image Overlay */}
          {isExternal ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          ) : (
            <button
              onClick={() => navigate(demoUrl)}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
          )}

          {/* Badges Overlay */}
          {product.displayTag ? (
            <span className="absolute left-2.5 top-2.5 z-20 rounded-md bg-emerald-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm pointer-events-none">
              {product.displayTag}
            </span>
          ) : null}

          {product.price && (
            <span className="absolute right-2.5 top-2.5 z-20 rounded-full bg-ink-950/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-extrabold text-cloud-100 shadow-sm border border-white/10 pointer-events-none">
              Starting ₹{product.price.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      {/* Content Details */}
      <div className="mt-4 flex flex-1 flex-col justify-between text-left">
        <div>
          <h3 className="font-display text-base font-bold text-cloud-100 line-clamp-1 group-hover:text-brand-300 transition">
            {isExternal ? (
              <a href={demoUrl} target="_blank" rel="noopener noreferrer">
                {product.name}
              </a>
            ) : (
              product.name
            )}
          </h3>

          {/* 3-4 Highlights Points max */}
          <ul className="mt-3 space-y-2">
            {highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-cloud-300 font-medium leading-tight">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="line-clamp-1 break-words">{cleanText(highlight)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button: ALWAYS View Website */}
        <div className="mt-5 pt-3 border-t border-white/5 relative z-20">
          {isExternal ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 py-2.5 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 hover:text-white cursor-pointer"
            >
              <Eye size={14} /> View Website <ExternalLink size={12} />
            </a>
          ) : (
            <button
              onClick={() => navigate(demoUrl)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 py-2.5 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 hover:text-white cursor-pointer"
            >
              <Eye size={14} /> View Website <ExternalLink size={12} />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `DeliveredWebsites.jsx` to import it instead of defining it inline**

Replace the top of `src/components/home/DeliveredWebsites.jsx` (lines 1–126) from:
```jsx
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, ExternalLink, CheckCircle2, Eye, Globe } from "lucide-react"
import { useProducts } from "../../hooks/useProducts"
import { useNavigate } from "react-router-dom"
import { cleanText } from "../../lib/text"

function DeliveredWebsiteCard({ product }) {
  // ... (the whole function body that now lives in DeliveredWebsiteCard.jsx)
}
```
to:
```jsx
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useProducts } from "../../hooks/useProducts"
import DeliveredWebsiteCard from "./DeliveredWebsiteCard"
```
Leave everything below (the `DeliveredWebsiteMobileSlider` function and the default-exported `DeliveredWebsites` component) unchanged — they already reference `DeliveredWebsiteCard` by name and now resolve it via the import instead of the local function.

- [ ] **Step 3: Verify the build still succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -30
```
Expected: build completes without errors referencing `DeliveredWebsites.jsx` or `DeliveredWebsiteCard.jsx`.

- [ ] **Step 4: Manually verify no visual regression**

Start the frontend dev server (`npm run dev` from repo root) and the backend (`npm run server` from repo root, in another terminal), open the homepage in a browser, scroll to "Websites I've Built & Delivered", and confirm the cards render exactly as before (browser-mockup preview, highlights, "View Website" button).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/DeliveredWebsiteCard.jsx src/components/home/DeliveredWebsites.jsx
git commit -m "refactor: extract DeliveredWebsiteCard into its own file"
```

---

### Task 9: `DynamicSection` component

**Files:**
- Create: `src/components/home/DynamicSection.jsx`

**Interfaces:**
- Consumes: a resolved section object `{ _id, title, subtitle, layout, ctaLink, products }` (shape returned by `GET /api/home-sections`, Task 3); `ProductCard` (`src/components/home/ProductCard.jsx`), `DeliveredWebsiteCard` (Task 8), `ProductCarousel` (`src/components/home/ProductCarousel.jsx`), `SectionHeader` (`src/components/ui/SectionHeader.jsx`).
- Produces: default export `DynamicSection({ section })` — consumed by Task 10 (`Home.jsx`).

- [ ] **Step 1: Create the component**

```jsx
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import SectionHeader from "../ui/SectionHeader"
import ProductCard from "./ProductCard"
import DeliveredWebsiteCard from "./DeliveredWebsiteCard"
import ProductCarousel from "./ProductCarousel"

function sectionLink(section) {
  return section.ctaLink || "/products"
}

function PaginatedGrid({ section, itemsPerPage, CardComponent, gridClass }) {
  const [page, setPage] = useState(1)
  const products = section.products || []
  const pages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const paginatedItems = products.slice(startIndex, startIndex + itemsPerPage)

  return (
    <section className="container-rs py-8">
      <SectionHeader title={section.title} to={sectionLink(section)} />
      {section.subtitle && (
        <p className="-mt-4 mb-6 max-w-2xl text-sm text-cloud-400">{section.subtitle}</p>
      )}
      <div className="relative">
        <motion.div layout className={gridClass}>
          <AnimatePresence mode="popLayout">
            {paginatedItems.map((p, i) => (
              <motion.div
                key={p._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: (i % itemsPerPage) * 0.04 }}
              >
                <CardComponent product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 transition hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-cloud-400 select-none">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-cloud-300 disabled:opacity-30 transition hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  )
}

export default function DynamicSection({ section }) {
  const products = section.products || []
  if (products.length === 0) return null

  if (section.layout === "carousel") {
    return <ProductCarousel title={section.title} to={sectionLink(section)} products={products} />
  }

  if (section.layout === "showcase") {
    return (
      <PaginatedGrid
        section={section}
        itemsPerPage={6}
        CardComponent={DeliveredWebsiteCard}
        gridClass="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      />
    )
  }

  return (
    <PaginatedGrid
      section={section}
      itemsPerPage={8}
      CardComponent={ProductCard}
      gridClass="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4"
    />
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -30
```
Expected: build completes without errors referencing `DynamicSection.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/DynamicSection.jsx
git commit -m "feat: add generic DynamicSection component"
```

---

### Task 10: Rewire `Home.jsx` to render sections dynamically

**Files:**
- Modify: `src/pages/Home.jsx`

**Interfaces:**
- Consumes: `useHomeSections` (Task 7), `DynamicSection` (Task 9).

- [ ] **Step 1: Replace the file contents**

Replace all of `src/pages/Home.jsx` with:
```jsx
import Hero from "../components/home/Hero"
import StatsStrip from "../components/home/StatsStrip"
import WhyChooseUs from "../components/home/WhyChooseUs"
import CategoriesGrid from "../components/home/CategoriesGrid"
import DynamicSection from "../components/home/DynamicSection"
import LatestStack from "../components/home/LatestStack"
import PricingPlans from "../components/home/PricingPlans"
import ClientsMarquee from "../components/home/ClientsMarquee"
import BrandsSection from "../components/home/BrandsSection"
import DemoCenter from "../components/home/DemoCenter"
import Testimonials from "../components/home/Testimonials"
import Newsletter from "../components/home/Newsletter"
import { useHomeSections } from "../hooks/useHomeSections"

export default function Home() {
  const { data: sections } = useHomeSections()

  return (
    <>
      <Hero />
      <StatsStrip />
      <WhyChooseUs />
      <CategoriesGrid />
      {(sections || []).map((section) => (
        <DynamicSection key={section._id} section={section} />
      ))}
      <LatestStack />
      <PricingPlans />
      <ClientsMarquee />
      <BrandsSection />
      <DemoCenter />
      <Testimonials />
      <Newsletter />
    </>
  )
}
```

Note: `LatestStack` ("Freshly Dropped Releases") isn't one of the admin-managed sections (it's a "last 5 products" widget with a unique drag-stack visual, not a grid/carousel/showcase), so it stays static — same as `PricingPlans`, `ClientsMarquee`, etc. It moves from "right after Featured Products" to "right after the dynamic sections block," which is an acceptable minor reordering since it was never part of the admin-controlled sequence.

The old per-type components (`FeaturedProducts.jsx`, `ReadyWebsites.jsx`, `DeliveredWebsites.jsx`, and the inline `TypeCarousel` helper that lived in `Home.jsx`) are no longer imported anywhere after this change. Leave the now-unused `FeaturedProducts.jsx`, `ReadyWebsites.jsx`, and `DeliveredWebsites.jsx` component files in place for this task (don't delete them yet) — Task 15's end-to-end verification is the right point to confirm nothing else references them before cleanup.

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -30
```
Expected: build completes with no errors. (A warning about unused exports from `FeaturedProducts.jsx` etc., if `oxlint`/vite emits one, is expected and fine at this stage.)

- [ ] **Step 3: Manual browser verification**

With backend running (`npm run server`) and the Task 6 migration already applied, start the frontend (`npm run dev`) and open the homepage. Confirm:
- The 8 sections (Featured Products, Popular WordPress Plugins, Premium WordPress Themes, Ready Websites, Websites I've Built & Delivered, Handy Tools, Source Codes, SaaS Software) appear in that order, each showing real published products.
- Any section with zero matching published products doesn't render (no empty gap).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: render homepage sections dynamically from the admin-managed list"
```

---

### Task 11: Admin nav + route wiring

**Files:**
- Modify: `src/admin/navConfig.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `HomeSectionList` component (Task 12).

**Execution order note:** this task's `App.jsx` change imports `HomeSectionList.jsx`, which doesn't exist until Task 12 is done. **Implement Task 12 before this task**, even though it's numbered later — the numbering reflects presentation order (nav/routing conceptually comes before the page it points to), not execution order.

- [ ] **Step 1: Add the sidebar nav entry**

In `src/admin/navConfig.js`, change the import line:
```js
import {
  LayoutDashboard,
  Package,
  Globe,
  Tags,
  Grid3x3,
  Building2,
  ShoppingCart,
  Users,
  Monitor,
  Mail,
  CreditCard,
} from "lucide-react"
```
to:
```js
import {
  LayoutDashboard,
  Package,
  Globe,
  Tags,
  Grid3x3,
  Building2,
  ShoppingCart,
  Users,
  Monitor,
  Mail,
  CreditCard,
  Rows3,
} from "lucide-react"
```

Then change:
```js
  {
    label: "Catalog",
    links: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/delivered-websites", label: "Delivered Websites", icon: Globe },
      { to: "/admin/packages", label: "Packages & Pricing", icon: Tags },
      { to: "/admin/categories", label: "Categories", icon: Grid3x3 },
      { to: "/admin/brands", label: "Brands", icon: Building2 },
    ],
  },
  {
    label: "Sales",
```
to:
```js
  {
    label: "Catalog",
    links: [
      { to: "/admin/products", label: "Products", icon: Package },
      { to: "/admin/delivered-websites", label: "Delivered Websites", icon: Globe },
      { to: "/admin/packages", label: "Packages & Pricing", icon: Tags },
      { to: "/admin/categories", label: "Categories", icon: Grid3x3 },
      { to: "/admin/brands", label: "Brands", icon: Building2 },
    ],
  },
  {
    label: "Homepage",
    links: [{ to: "/admin/sections", label: "Homepage Sections", icon: Rows3 }],
  },
  {
    label: "Sales",
```

- [ ] **Step 2: Wire the route in `App.jsx`**

Change:
```js
import CategoryList from "./admin/pages/categories/CategoryList"
```
to:
```js
import CategoryList from "./admin/pages/categories/CategoryList"
import HomeSectionList from "./admin/pages/sections/HomeSectionList"
```

Change:
```js
                <Route path="categories" element={<CategoryList />} />
```
to:
```js
                <Route path="categories" element={<CategoryList />} />
                <Route path="sections" element={<HomeSectionList />} />
```

- [ ] **Step 3: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -30
```
Expected: build completes with no errors (this requires Task 12's `HomeSectionList.jsx` to already exist — confirm Task 12 is done first).

- [ ] **Step 4: Manual verification**

Log into `/admin` in the browser, confirm "Homepage Sections" appears under a "Homepage" group in the sidebar, and clicking it navigates to `/admin/sections` without a blank/error page.

- [ ] **Step 5: Commit**

```bash
git add src/admin/navConfig.js src/App.jsx
git commit -m "feat: wire Homepage Sections into admin nav and routes"
```

---

### Task 12: Admin "Homepage Sections" page

**Files:**
- Create: `src/admin/pages/sections/HomeSectionList.jsx`

**Interfaces:**
- Consumes: `useAdminHomeSections`, `useCreateHomeSection`, `useUpdateHomeSection`, `useDeleteHomeSection`, `useReorderHomeSections` (Task 7); `useCategories` (`src/hooks/useCategories.js`); `useProducts` (`src/hooks/useProducts.js`); `DataTable`, `ConfirmDialog` (`src/admin/components/`); `apiErrorMessage` (`src/lib/api.js`).

**Note on execution order:** implement this task before Task 11 (see Task 11's note) so `App.jsx` never imports a nonexistent file.

- [ ] **Step 1: Create the admin page**

```jsx
import { useState } from "react"
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Search, X } from "lucide-react"
import toast from "react-hot-toast"
import {
  useAdminHomeSections,
  useCreateHomeSection,
  useUpdateHomeSection,
  useDeleteHomeSection,
  useReorderHomeSections,
} from "../../../hooks/useHomeSections"
import { useCategories } from "../../../hooks/useCategories"
import { useProducts } from "../../../hooks/useProducts"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"

const PRODUCT_TYPES = [
  { value: "any", label: "Any Type" },
  { value: "plugin", label: "Plugin" },
  { value: "theme", label: "Theme" },
  { value: "ready-website", label: "Ready Website" },
  { value: "delivered-website", label: "Delivered Website" },
  { value: "package", label: "Package" },
  { value: "saas", label: "SaaS" },
  { value: "source-code", label: "Source Code" },
  { value: "tool", label: "Tool" },
  { value: "other", label: "Other" },
]

const emptyForm = {
  title: "",
  subtitle: "",
  layout: "grid",
  selectionMode: "auto",
  filters: { category: "", type: "any", onlyFeatured: false },
  manualProducts: [],
  maxItems: 8,
  isActive: true,
}

export default function HomeSectionList() {
  const { data: sections, isLoading } = useAdminHomeSections()
  const { data: categories } = useCategories()
  const createSection = useCreateHomeSection()
  const updateSection = useUpdateHomeSection()
  const deleteSection = useDeleteHomeSection()
  const reorderSections = useReorderHomeSections()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [productQuery, setProductQuery] = useState("")

  const { data: searchResults } = useProducts({ search: productQuery, limit: 10 })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(section) {
    setEditing(section)
    setForm({
      title: section.title,
      subtitle: section.subtitle || "",
      layout: section.layout,
      selectionMode: section.selectionMode,
      filters: {
        category: section.filters?.category?._id || section.filters?.category || "",
        type: section.filters?.type || "any",
        onlyFeatured: Boolean(section.filters?.onlyFeatured),
      },
      manualProducts: section.manualProducts || [],
      maxItems: section.maxItems,
      isActive: section.isActive,
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      layout: form.layout,
      selectionMode: form.selectionMode,
      maxItems: Number(form.maxItems),
      isActive: form.isActive,
      filters: {
        category: form.filters.category || null,
        type: form.filters.type,
        onlyFeatured: form.filters.onlyFeatured,
      },
      manualProducts: form.manualProducts.map((p) => p._id || p),
    }

    try {
      if (editing) {
        await updateSection.mutateAsync({ id: editing._id, ...payload })
        toast.success("Section updated")
      } else {
        await createSection.mutateAsync(payload)
        toast.success("Section created")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function confirmDelete() {
    try {
      await deleteSection.mutateAsync(pendingDelete._id)
      toast.success("Section deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function move(section, direction) {
    const ordered = [...(sections || [])].sort((a, b) => a.order - b.order)
    const index = ordered.findIndex((s) => s._id === section._id)
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= ordered.length) return

    const ids = ordered.map((s) => s._id)
    ;[ids[index], ids[swapWith]] = [ids[swapWith], ids[index]]

    try {
      await reorderSections.mutateAsync(ids)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function toggleActive(section) {
    try {
      await updateSection.mutateAsync({ id: section._id, isActive: !section.isActive })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  function addManualProduct(product) {
    if (form.manualProducts.some((p) => (p._id || p) === product._id)) return
    setForm((f) => ({ ...f, manualProducts: [...f.manualProducts, product] }))
  }

  function removeManualProduct(productId) {
    setForm((f) => ({ ...f, manualProducts: f.manualProducts.filter((p) => (p._id || p) !== productId) }))
  }

  function moveManualProduct(index, direction) {
    setForm((f) => {
      const list = [...f.manualProducts]
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= list.length) return f
      ;[list[index], list[swapWith]] = [list[swapWith], list[index]]
      return { ...f, manualProducts: list }
    })
  }

  const saving = createSection.isPending || updateSection.isPending
  const ordered = [...(sections || [])].sort((a, b) => a.order - b.order)

  const columns = [
    { key: "title", label: "Section", render: (s) => <span className="font-medium text-cloud-100">{s.title}</span> },
    { key: "layout", label: "Layout" },
    { key: "selectionMode", label: "Mode", render: (s) => (s.selectionMode === "manual" ? "Manual" : "Auto") },
    { key: "productCount", label: "Products" },
    {
      key: "isActive",
      label: "Active",
      render: (s) => (
        <button
          onClick={() => toggleActive(s)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            s.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-cloud-500"
          }`}
        >
          {s.isActive ? "Active" : "Hidden"}
        </button>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          <Plus size={16} /> New Section
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={ordered}
        loading={isLoading}
        emptyMessage="No homepage sections yet."
        actions={(s) => (
          <>
            <button
              onClick={() => move(s, "up")}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Move up"
            >
              <ArrowUp size={15} />
            </button>
            <button
              onClick={() => move(s, "down")}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Move down"
            >
              <ArrowDown size={15} />
            </button>
            <button
              onClick={() => openEdit(s)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setPendingDelete(s)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
              aria-label="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-ink-850 p-6"
          >
            <h2 className="font-display text-base font-bold text-cloud-100">
              {editing ? "Edit Section" : "New Section"}
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Subtitle (optional)</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">Layout</label>
                <select
                  value={form.layout}
                  onChange={(e) => setForm((f) => ({ ...f, layout: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                >
                  <option value="grid">Grid</option>
                  <option value="carousel">Carousel</option>
                  <option value="showcase">Showcase (website preview cards)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">Max items</label>
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={form.maxItems}
                  onChange={(e) => setForm((f) => ({ ...f, maxItems: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">How should products be picked?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, selectionMode: "auto" }))}
                  className={`flex-1 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    form.selectionMode === "auto"
                      ? "border-brand-500/60 bg-brand-500/10 text-brand-200"
                      : "border-white/10 text-cloud-400 hover:bg-white/5"
                  }`}
                >
                  Auto-filter
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, selectionMode: "manual" }))}
                  className={`flex-1 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                    form.selectionMode === "manual"
                      ? "border-brand-500/60 bg-brand-500/10 text-brand-200"
                      : "border-white/10 text-cloud-400 hover:bg-white/5"
                  }`}
                >
                  Manually pick products
                </button>
              </div>
            </div>

            {form.selectionMode === "auto" ? (
              <div className="space-y-3 rounded-xl border border-white/10 p-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cloud-400">Category</label>
                  <select
                    value={form.filters.category}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, category: e.target.value } }))}
                    className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {(categories || []).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cloud-400">Product Type</label>
                  <select
                    value={form.filters.type}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, type: e.target.value } }))}
                    className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  >
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-cloud-300">
                  <input
                    type="checkbox"
                    checked={form.filters.onlyFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, filters: { ...f.filters, onlyFeatured: e.target.checked } }))}
                    className="h-4 w-4 rounded border-white/20 bg-ink-800"
                  />
                  Only show featured products
                </label>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-white/10 p-3.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud-500" />
                  <input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products to add…"
                    className="w-full rounded-lg border border-white/10 bg-ink-800 py-2.5 pl-9 pr-3.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                  />
                </div>
                {productQuery && (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-1.5">
                    {(searchResults?.items || []).map((p) => (
                      <button
                        type="button"
                        key={p._id}
                        onClick={() => addManualProduct(p)}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm text-cloud-200 hover:bg-white/5"
                      >
                        {p.name}
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  {form.manualProducts.map((p, i) => (
                    <div key={p._id || p} className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm text-cloud-200">
                      <span className="truncate">{p.name || p}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveManualProduct(i, "up")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                          <ArrowUp size={13} />
                        </button>
                        <button type="button" onClick={() => moveManualProduct(i, "down")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                          <ArrowDown size={13} />
                        </button>
                        <button type="button" onClick={() => removeManualProduct(p._id || p)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.manualProducts.length === 0 && (
                    <p className="text-xs text-cloud-500">No products added yet. Search above to add some.</p>
                  )}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-cloud-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-ink-800"
              />
              Show this section on the homepage
            </label>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete section?"
        message={`This will permanently delete "${pendingDelete?.title}" from the homepage.`}
        busy={deleteSection.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -30
```
Expected: build completes with no errors referencing `HomeSectionList.jsx`. (`App.jsx`/`navConfig.js` won't yet import this file until Task 11 runs — that's fine, this file is self-contained.)

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/sections/HomeSectionList.jsx
git commit -m "feat: add admin Homepage Sections page"
```

---

### Task 13: End-to-end manual verification and cleanup

**Files:**
- Delete (pending Step 1's confirmation): `src/components/home/FeaturedProducts.jsx`, `src/components/home/ReadyWebsites.jsx`, `src/components/home/DeliveredWebsites.jsx` — all three are fully superseded by `DynamicSection.jsx` (Task 9) now that `Home.jsx` (Task 10) no longer imports any of them. `DeliveredWebsiteCard.jsx` (Task 8) is kept — it's a separate file, still in active use.

**Interfaces:** none (verification-only task).

- [ ] **Step 1: Confirm no remaining references to the retired components**

Run:
```bash
cd "/c/clnt prjct/rswebsoft" && grep -rn "FeaturedProducts\|ReadyWebsites\|DeliveredWebsites" src --include="*.jsx" | grep -v "DeliveredWebsiteCard"
```
Expected: no matches in `src/pages/Home.jsx` (already rewired in Task 10). If `FeaturedProducts.jsx`, `ReadyWebsites.jsx`, or `DeliveredWebsites.jsx` show up only as their own file definitions (not imported elsewhere), they're dead code — safe to delete.

- [ ] **Step 2: Delete the dead component files**

```bash
git rm src/components/home/FeaturedProducts.jsx src/components/home/ReadyWebsites.jsx src/components/home/DeliveredWebsites.jsx
```
(`DeliveredWebsiteCard.jsx`, created in Task 8, is kept — it's actively used by `DynamicSection.jsx`.)

- [ ] **Step 3: Verify the build succeeds after deletion**

Run:
```bash
npx vite build --mode development 2>&1 | tail -30
```
Expected: build completes with no errors (no dangling imports).

- [ ] **Step 4: Full manual walkthrough**

With both servers running (`npm run server` and `npm run dev`):
1. Open `/admin/sections`. Confirm all 8 migrated sections are listed with correct layout/mode/product counts.
2. Create a new category at `/admin/categories` (e.g. "AI Tools"), add 2–3 published products to it via `/admin/products` with that category set.
3. Back in `/admin/sections`, click "New Section", set Title = "AI Tools", Layout = Carousel, Auto-filter, Category = "AI Tools", save.
4. Open the public homepage — confirm the new "AI Tools" section appears with the products just added, positioned last (since new sections get the highest `order`).
5. Use the ▲ button to move "AI Tools" up a few positions; reload the homepage and confirm the new order took effect.
6. Toggle "AI Tools" to Hidden; reload the homepage and confirm it disappears (but is still listed, greyed, in `/admin/sections`).
7. Edit "Featured Products", change its Max Items to 4; reload the homepage and confirm only 4 products show.
8. Try deleting the "AI Tools" category from `/admin/categories` while the section still references it — confirm it's blocked with the "used by a homepage section" error.

- [ ] **Step 5: Commit the cleanup**

```bash
git add -A
git commit -m "chore: remove homepage components superseded by DynamicSection"
```
