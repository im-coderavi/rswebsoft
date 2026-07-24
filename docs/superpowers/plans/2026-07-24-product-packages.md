# Product Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-product `packages` array (name/price/description), let admins add/edit/remove/reorder them in `ProductForm`, bulk-seed "Buy Source Code" / "Installation" defaults onto all existing products, and show packages as an informational (non-purchasable) section on the product page.

**Architecture:** New `packages` subdocument array on the `Product` model. No controller/route changes — `createProduct`/`updateProduct` already pass `req.body` straight through. Admin UI reuses the add/remove/reorder interaction shape already proven for the Features editor. A one-time idempotent script (mirroring `seedHomeSections.js`) backfills existing products.

**Tech Stack:** Mongoose (backend), React 19 (frontend), lucide-react icons, existing `formatINR` currency helper.

## Global Constraints

- No changes to `CartContext`, checkout, or the `Order` model — packages are informational only, never added to cart.
- No new backend routes/controllers — the existing `createProduct`/`updateProduct` handlers already accept arbitrary schema fields via `req.body`.
- This repo has no automated test framework — verification is `vite build` (frontend) / a syntax-load check (backend) plus a manual browser walkthrough.

---

### Task 1: Add `packages` field to the `Product` model

**Files:**
- Modify: `server/src/models/Product.js`

**Interfaces:**
- Produces: `Product.packages` — array of `{ name: String, price: Number, description: String }`. Consumed by Task 3 (migration script), Task 4 (admin form), Task 5 (product page). No controller changes needed since `createProduct`/`updateProduct` pass `req.body` through directly.

- [ ] **Step 1: Add the field**

In `server/src/models/Product.js`, change:
```js
    features: [{ type: String, trim: true }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
```
to:
```js
    features: [{ type: String, trim: true }],
    packages: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: "" },
      },
    ],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
```

- [ ] **Step 2: Verify the model loads without a DB connection**

Run (from repo root):
```bash
cd server && node --input-type=module -e "import Product from './src/models/Product.js'; console.log(Object.keys(Product.schema.paths).includes('packages'))"
```
Expected output: `true`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/Product.js
git commit -m "feat: add packages field to Product model"
```

---

### Task 2: Migration script — default packages for existing products

**Files:**
- Create: `server/scripts/seedProductPackages.js`
- Modify: `server/package.json` (add script entry)

**Interfaces:**
- Consumes: `connectDB` (`server/src/config/db.js`), `Product` model (Task 1).

- [ ] **Step 1: Create the script**

```js
import "dotenv/config"
import { connectDB } from "../src/config/db.js"
import Product from "../src/models/Product.js"

const INSTALLATION_MARKUP = 499

async function run() {
  await connectDB()

  const products = await Product.find()
  let seeded = 0
  let skipped = 0

  for (const product of products) {
    if (product.packages && product.packages.length > 0) {
      skipped += 1
      continue
    }

    product.packages = [
      { name: "Buy Source Code", price: product.price },
      { name: "Installation", price: product.price + INSTALLATION_MARKUP },
    ]
    await product.save()
    seeded += 1
  }

  console.log(`Seeded packages for ${seeded} product(s), skipped ${skipped} (already had packages).`)
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
    "seed-sections": "node scripts/seedHomeSections.js",
```
to:
```json
    "seed-sections": "node scripts/seedHomeSections.js",
    "seed-packages": "node scripts/seedProductPackages.js",
```

- [ ] **Step 3: Run it and verify**

Run:
```bash
cd server && npm run seed-packages
```
Expected: a line like `Seeded packages for 226 product(s), skipped 0 (already had packages).` with no stack trace.

Then verify one product via the API:
```bash
curl -s http://localhost:5000/api/products?limit=1 | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const p=JSON.parse(d).items[0];console.log(JSON.stringify(p.packages))})"
```
Expected output: an array with two entries, `"Buy Source Code"` at the product's price and `"Installation"` at price + 499.

Run it a second time to confirm idempotency:
```bash
npm run seed-packages
```
Expected: `Seeded packages for 0 product(s), skipped 226 (already had packages).`

- [ ] **Step 4: Commit**

```bash
git add server/scripts/seedProductPackages.js server/package.json
git commit -m "feat: add migration script for default product packages"
```

---

### Task 3: Admin — Packages editor in `ProductForm.jsx`

**Files:**
- Modify: `src/admin/pages/products/ProductForm.jsx`

**Interfaces:**
- Consumes: nothing new (self-contained state, same pattern as the existing `featureInput`/`addFeature`/`removeFeature`/`moveFeature` block added for the Features editor).
- Produces: `form.packages` — array of `{ name, price, description }` — included in the `handleSubmit` payload and initialized from `existing.packages` on load.

- [ ] **Step 1: Add `packages: []` to `emptyForm`**

Change:
```jsx
  tags: "",
  features: [],
  demoUrl: "",
```
to:
```jsx
  tags: "",
  features: [],
  packages: [],
  demoUrl: "",
```

- [ ] **Step 2: Initialize `packages` when loading an existing product**

Change:
```jsx
      features: existing.features || [],
```
to:
```jsx
      features: existing.features || [],
      packages: existing.packages || [],
```

- [ ] **Step 3: Include `packages` in the submit payload**

Change:
```jsx
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features,
```
to:
```jsx
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features,
      packages: form.packages,
```

- [ ] **Step 4: Add package-editor local state and helper functions**

Right after the existing `moveFeature` function (added for the Features editor), add:
```jsx
  const [packageName, setPackageName] = useState("")
  const [packagePrice, setPackagePrice] = useState("")
  const [packageDescription, setPackageDescription] = useState("")

  function addPackage() {
    const name = packageName.trim()
    const price = Number(packagePrice)
    if (!name || !packagePrice || Number.isNaN(price) || price < 0) return
    setForm((f) => ({ ...f, packages: [...f.packages, { name, price, description: packageDescription.trim() }] }))
    setPackageName("")
    setPackagePrice("")
    setPackageDescription("")
  }

  function removePackage(index) {
    setForm((f) => ({ ...f, packages: f.packages.filter((_, i) => i !== index) }))
  }

  function movePackage(index, direction) {
    setForm((f) => {
      const list = [...f.packages]
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= list.length) return f
      ;[list[index], list[swapWith]] = [list[swapWith], list[index]]
      return { ...f, packages: list }
    })
  }
```

- [ ] **Step 5: Add the Packages section JSX, right after the Features `<div>` block**

Insert immediately after the closing `</div>` of the Features section (the block ending with `{form.features.length === 0 && (...)}\n          </div>\n        </div>`):
```jsx
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            Packages <span className="text-cloud-500">(shown as an info section on the product page — doesn't affect Buy Now/Cart)</span>
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
            <input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Installation"
              className="rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
            <input
              type="number"
              min="0"
              value={packagePrice}
              onChange={(e) => setPackagePrice(e.target.value)}
              placeholder="Price"
              className="rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
            <input
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="Description (optional)"
              className="rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={addPackage}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2.5 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
            >
              <Plus size={15} /> Add
            </button>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {form.packages.map((pkg, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-ink-800 px-3 py-2 text-sm text-cloud-200">
                <div className="min-w-0 truncate">
                  <span className="font-semibold">{pkg.name}</span>
                  <span className="text-cloud-400"> — ₹{Number(pkg.price).toLocaleString("en-IN")}</span>
                  {pkg.description && <span className="text-cloud-500"> — {pkg.description}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => movePackage(i, "up")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                    <ArrowUp size={13} />
                  </button>
                  <button type="button" onClick={() => movePackage(i, "down")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                    <ArrowDown size={13} />
                  </button>
                  <button type="button" onClick={() => removePackage(i)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
            {form.packages.length === 0 && (
              <p className="text-xs text-cloud-500">No packages added yet.</p>
            )}
          </div>
        </div>
```

(No new icon imports needed — `Plus`, `X`, `ArrowUp`, `ArrowDown` are already imported from the Features editor task.)

- [ ] **Step 6: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 7: Manual verification**

With both dev servers running, open any product's edit page at `/admin/products/<id>/edit`:
1. Confirm the "Packages" section appears below Features, and (after Task 2's migration ran) shows the two seeded packages ("Buy Source Code" and "Installation" with correct prices).
2. Add a new package with name, price, and description — confirm it appears as a row.
3. Try adding with an empty name or empty price — confirm "Add" does nothing (no blank row created).
4. Reorder with ▲▼, remove one with ✕.
5. Save the product, reload the edit page, confirm the saved packages (in the edited order) persist.

- [ ] **Step 8: Commit**

```bash
git add src/admin/pages/products/ProductForm.jsx
git commit -m "feat: add Packages editor to ProductForm"
```

---

### Task 4: Display packages on the product page

**Files:**
- Modify: `src/pages/ProductDetail.jsx`

**Interfaces:**
- Consumes: `product.packages` (Task 1), `formatINR` (`src/lib/currency.js`, already imported in this file).

- [ ] **Step 1: Add a `Package` icon import**

Change:
```jsx
import { 
  ShoppingCart, 
  Zap, 
  Eye, 
  Check, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react"
```
to:
```jsx
import { 
  ShoppingCart, 
  Zap, 
  Eye, 
  Check, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package
} from "lucide-react"
```

- [ ] **Step 2: Add the packages section after the Features card**

Insert immediately after the closing `</div>` of the Features card block (the block starting with `{product.features?.length > 0 && (` and ending with its matching `)}`), still inside the `lg:col-span-8 space-y-6` column:
```jsx
            {/* Packages Card (If present) — informational only, no purchase action */}
            {product.packages?.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                    <Package size={16} />
                  </span>
                  <h2 className="font-display text-lg font-bold text-cloud-100">
                    Available Packages
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.packages.map((pkg, idx) => (
                    <div key={idx} className="rounded-xl border border-white/5 bg-ink-850/60 p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-cloud-100">{pkg.name}</span>
                        <span className="text-sm font-extrabold text-brand-300">{formatINR(pkg.price)}</span>
                      </div>
                      {pkg.description && (
                        <p className="mt-1.5 text-xs text-cloud-400 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
```

- [ ] **Step 3: Verify the build succeeds**

Run (from repo root):
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 4: Manual verification**

With both dev servers running, open a product's public page (`/products/<slug>` for a product whose packages were seeded in Task 2 or edited in Task 3):
1. Confirm an "Available Packages" card appears below "Key Features Included", showing "Buy Source Code" and "Installation" with their prices formatted as currency (₹...).
2. Confirm the existing Buy Now / Add to Cart / Live Preview buttons and behavior are completely unchanged — clicking them still adds the base product at its normal price, unaffected by the packages shown.
3. Open a product with an empty `packages` array (or a newly created product before running the migration) — confirm the "Available Packages" card doesn't render at all (no empty box).

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProductDetail.jsx
git commit -m "feat: display product packages as an informational section on the product page"
```

---

### Task 5: Full end-to-end verification

**Files:** none (verification-only task).

- [ ] **Step 1: Final build check**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: clean build, no errors.

- [ ] **Step 2: Full regression walkthrough**

With both dev servers running:
1. Confirm `npm run seed-packages` (Task 2) has been run and is idempotent (re-running reports 0 seeded, all skipped).
2. Pick 2-3 different products across different categories/types, open their public pages, and confirm each shows its "Available Packages" card with correct prices.
3. Edit one product's packages in the admin (add a third custom package, e.g. "Priority Support" at a custom price), save, and confirm it appears correctly on the public product page in the order set.
4. Confirm Buy Now / Add to Cart still work normally on all checked products (cart total reflects only the base product price, not any package price).

- [ ] **Step 3: Commit (if any leftover changes)**

```bash
git status
```
If clean, no commit needed — this task is verification-only.

