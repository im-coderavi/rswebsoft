# Purchasable Product Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each product package independently buyable (its own Buy Now / Add to Cart, its own feature bullet list, its own price flowing correctly into the order), fully admin-editable, with demo feature bullets backfilled onto the two existing default packages on all products.

**Architecture:** Package subdocuments gain a `features` array. Cart items gain an optional `packageId`/`packageName` and are keyed by `(productId, packageId)` instead of `productId` alone, so a product's base purchase and its package purchases coexist as separate cart lines. The order-creation endpoint is taught to price a line from the referenced package (via Mongoose's subdocument `.id()` lookup) instead of always falling back to the base product price — this is a required correctness fix, not optional, since the feature doesn't work without it. No new `Order` schema field is needed: the order line's `name` is composed as `"{product name} — {package name}"` when a package was purchased, which the existing generic item-name rendering on `OrderTrack.jsx`/admin already displays correctly with zero further changes.

**Tech Stack:** Mongoose, React 19, react-query, lucide-react, existing `formatINR`/`cleanText` helpers.

## Global Constraints

- Base product Buy Now / Add to Cart / Live Preview (the top Buy Box) must remain completely unchanged in behavior.
- This repo has no automated test framework — verification is `vite build` (frontend) / a syntax-load check (backend) plus a manual browser walkthrough, including at least one real add-to-cart-and-checkout-math check.
- No new Order schema fields — package context is captured by composing the order line's `name` string server-side.

---

### Task 1: Add `features` to the package subdocument

**Files:**
- Modify: `server/src/models/Product.js`

**Interfaces:**
- Produces: `Product.packages[].features` — `[String]`, same shape as the top-level `features` array. Consumed by Task 2 (migration), Task 6 (product page), Task 7 (admin form).

- [ ] **Step 1: Add the field**

Change:
```js
    packages: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: "" },
      },
    ],
```
to:
```js
    packages: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: "" },
        features: [{ type: String, trim: true }],
      },
    ],
```

- [ ] **Step 2: Verify the model loads without a DB connection**

Run (from repo root):
```bash
cd server && node --input-type=module -e "import Product from './src/models/Product.js'; const p = new Product({ name:'x', price:1, category:'000000000000000000000000', packages:[{name:'A',price:1}] }); console.log(p.packages[0].features)"
```
Expected output: `[]`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/Product.js
git commit -m "feat: add features array to product package subdocument"
```

---

### Task 2: Migration script — demo feature bullets for default packages

**Files:**
- Create: `server/scripts/seedProductPackageFeatures.js`
- Modify: `server/package.json`

**Interfaces:**
- Consumes: `connectDB`, `Product` model (Task 1).

- [ ] **Step 1: Create the script**

```js
import "dotenv/config"
import { connectDB } from "../src/config/db.js"
import Product from "../src/models/Product.js"

const DEFAULT_FEATURES = {
  "Buy Source Code": [
    "Full source code files",
    "Free lifetime updates",
    "Documentation included",
    "Email support for setup queries",
  ],
  Installation: [
    "Everything in Buy Source Code",
    "Professional installation on your hosting server",
    "Domain & server configuration",
    "1-on-1 setup call with our team",
    "7-day post-installation support",
  ],
}

async function run() {
  await connectDB()

  const products = await Product.find()
  let updated = 0

  for (const product of products) {
    let changed = false
    for (const pkg of product.packages) {
      const defaults = DEFAULT_FEATURES[pkg.name]
      if (defaults && (!pkg.features || pkg.features.length === 0)) {
        pkg.features = defaults
        changed = true
      }
    }
    if (changed) {
      await product.save()
      updated += 1
    }
  }

  console.log(`Added demo features to packages on ${updated} product(s).`)
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
    "seed-packages": "node scripts/seedProductPackages.js",
```
to:
```json
    "seed-packages": "node scripts/seedProductPackages.js",
    "seed-package-features": "node scripts/seedProductPackageFeatures.js",
```

- [ ] **Step 3: Run it and verify**

Run:
```bash
cd server && npm run seed-package-features
```
Expected: `Added demo features to packages on <N> product(s).` (N should be close to 226, minus any products whose packages were already customized with features).

Verify one product via the API:
```bash
curl -s http://localhost:5000/api/products?limit=1 | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const p=JSON.parse(d).items[0];console.log(JSON.stringify(p.packages.map(x=>({name:x.name,features:x.features}))))})"
```
Expected: "Buy Source Code" and "Installation" packages each show their 4/5 demo bullets.

Re-run to confirm idempotency:
```bash
npm run seed-package-features
```
Expected: `Added demo features to packages on 0 product(s).`

- [ ] **Step 4: Commit**

```bash
git add server/scripts/seedProductPackageFeatures.js server/package.json
git commit -m "feat: add migration script for demo package feature bullets"
```

---

### Task 3: Cart — key items by (productId, packageId)

**Files:**
- Modify: `src/context/CartContext.jsx`

**Interfaces:**
- Produces: `add(product, qty)` where `product` may include `packageId`/`packageName` (both `undefined` for a base-product purchase — existing callers are unaffected). `remove(productId, packageId)` and `updateQty(productId, qty, packageId)` — `packageId` is an optional third/second param that defaults to `undefined`, so existing call sites that omit it keep matching base-product lines exactly as before.

- [ ] **Step 1: Update `add`, `remove`, `updateQty`**

Change:
```jsx
  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.productId ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { ...product, qty }]
    })
  }, [])

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQty = useCallback((productId, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i))
    )
  }, [])
```
to:
```jsx
  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.productId && i.packageId === product.packageId)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.productId && i.packageId === product.packageId ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { ...product, qty }]
    })
  }, [])

  const remove = useCallback((productId, packageId) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.packageId === packageId)))
  }, [])

  const updateQty = useCallback((productId, qty, packageId) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId && i.packageId === packageId ? { ...i, qty: Math.max(1, qty) } : i))
    )
  }, [])
```

- [ ] **Step 2: Verify the build succeeds**

Run (from repo root):
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build fails or succeeds with type-irrelevant warnings only — this file alone has no consumers changed yet, so a plain build pass is fine; full behavioral verification happens after Tasks 4 and 6 wire the new params through.

- [ ] **Step 3: Commit**

```bash
git add src/context/CartContext.jsx
git commit -m "feat: key cart items by product and package so package purchases don't collide with the base product"
```

---

### Task 4: Cart & Checkout — display and wire package context

**Files:**
- Modify: `src/pages/Cart.jsx`
- Modify: `src/pages/Checkout.jsx`

**Interfaces:**
- Consumes: `item.packageId`/`item.packageName` (Task 3's cart item shape).

- [ ] **Step 1: Update `Cart.jsx`'s list key, name display, and remove/updateQty calls**

Change:
```jsx
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border border-white/8 bg-ink-850 p-4"
            >
```
to:
```jsx
          {items.map((item) => (
            <div
              key={`${item.productId}:${item.packageId || "base"}`}
              className="flex items-center gap-4 rounded-xl border border-white/8 bg-ink-850 p-4"
            >
```

Change:
```jsx
                <Link to={`/products/${item.slug}`} className="block truncate text-sm font-semibold text-cloud-100 hover:text-brand-300">
                  {item.name}
                </Link>
```
to:
```jsx
                <Link to={`/products/${item.slug}`} className="block truncate text-sm font-semibold text-cloud-100 hover:text-brand-300">
                  {item.name}{item.packageName ? ` — ${item.packageName}` : ""}
                </Link>
```

Change:
```jsx
                <button
                  onClick={() => updateQty(item.productId, item.qty - 1)}
                  className="grid h-8 w-8 place-items-center text-cloud-300 hover:text-cloud-100"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm text-cloud-100">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.productId, item.qty + 1)}
                  className="grid h-8 w-8 place-items-center text-cloud-300 hover:text-cloud-100"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
```
to:
```jsx
                <button
                  onClick={() => updateQty(item.productId, item.qty - 1, item.packageId)}
                  className="grid h-8 w-8 place-items-center text-cloud-300 hover:text-cloud-100"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm text-cloud-100">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.productId, item.qty + 1, item.packageId)}
                  className="grid h-8 w-8 place-items-center text-cloud-300 hover:text-cloud-100"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
```

Change:
```jsx
              <button
                onClick={() => remove(item.productId)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-cloud-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
```
to:
```jsx
              <button
                onClick={() => remove(item.productId, item.packageId)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-cloud-500 transition hover:bg-rose-500/15 hover:text-rose-400"
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
```

- [ ] **Step 2: Update `Checkout.jsx`'s list key, name display, and submit payload**

Change:
```jsx
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-cloud-400">
                <span className="min-w-0 truncate pr-3">{item.name} × {item.qty}</span>
                <span className="shrink-0 text-cloud-100">{formatINR(item.price * item.qty)}</span>
              </div>
            ))}
```
to:
```jsx
            {items.map((item) => (
              <div key={`${item.productId}:${item.packageId || "base"}`} className="flex justify-between text-sm text-cloud-400">
                <span className="min-w-0 truncate pr-3">{item.name}{item.packageName ? ` — ${item.packageName}` : ""} × {item.qty}</span>
                <span className="shrink-0 text-cloud-100">{formatINR(item.price * item.qty)}</span>
              </div>
            ))}
```

Change:
```jsx
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
```
to:
```jsx
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, packageId: i.packageId })),
```

- [ ] **Step 3: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Cart.jsx src/pages/Checkout.jsx
git commit -m "feat: display package context and pass packageId through cart and checkout"
```

---

### Task 5: Backend — price/name integrity for package purchases

**Files:**
- Modify: `server/src/controllers/orderController.js`

**Interfaces:**
- Consumes: `item.packageId` (optional, sent by Task 4's checkout payload), `product.packages` (Task 1).
- Produces: order line `name` composed as `"{product name} — {package name}"` when a package was purchased — no `Order` schema change, since `OrderTrack.jsx`/`AccountOrders.jsx` already render `item.name` generically.

- [ ] **Step 1: Update the order-item mapping**

Change:
```js
  const productById = new Map(products.map((p) => [String(p._id), p]))
  const orderItems = items.map((i) => {
    const product = productById.get(i.productId)
    const qty = Math.max(1, Number(i.qty) || 1)
    return {
      product: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      qty,
    }
  })
```
to:
```js
  const productById = new Map(products.map((p) => [String(p._id), p]))
  const orderItems = items.map((i) => {
    const product = productById.get(i.productId)
    const qty = Math.max(1, Number(i.qty) || 1)

    if (i.packageId) {
      const pkg = product.packages.id(i.packageId)
      if (!pkg) throw new ApiError(400, "One or more items are no longer available")
      return {
        product: product._id,
        name: `${product.name} — ${pkg.name}`,
        price: pkg.price,
        qty,
      }
    }

    return {
      product: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      qty,
    }
  })
```

- [ ] **Step 2: Verify the controller loads cleanly**

Run:
```bash
cd server && node --input-type=module -e "import * as c from './src/controllers/orderController.js'; console.log(typeof c.createOrder)"
```
Expected output: `function`

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/orderController.js
git commit -m "fix: price package purchases from the selected package, not the base product price"
```

---

### Task 6: Product page — buyable package cards with feature bullets

**Files:**
- Modify: `src/pages/ProductDetail.jsx`

**Interfaces:**
- Consumes: `product.packages[].features` (Task 1), `useCart().add` (Task 3's extended shape).

- [ ] **Step 1: Extend `cartItem`, `handleAddToCart`, `handleBuyNow` to accept an optional package**

Change:
```jsx
  function cartItem() {
    return {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: images[0]?.url || "",
      price: effectivePrice,
    }
  }

  function handleAddToCart() {
    add(cartItem(), 1)
    toast.success(`${product.name} added to cart`)
  }

  function handleBuyNow() {
    add(cartItem(), 1)
    navigate("/checkout")
  }
```
to:
```jsx
  function cartItem(pkg) {
    return {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: images[0]?.url || "",
      price: pkg ? pkg.price : effectivePrice,
      packageId: pkg ? pkg._id : undefined,
      packageName: pkg ? pkg.name : undefined,
    }
  }

  function handleAddToCart(pkg) {
    add(cartItem(pkg), 1)
    toast.success(`${pkg ? pkg.name : product.name} added to cart`)
  }

  function handleBuyNow(pkg) {
    add(cartItem(pkg), 1)
    navigate("/checkout")
  }
```

(Existing calls `onClick={handleAddToCart}` / `onClick={handleBuyNow}` on the top Buy Box keep working unchanged — `pkg` is `undefined`, so `cartItem(undefined)` produces exactly the same object as before.)

- [ ] **Step 2: Add feature bullets and Buy Now/Add to Cart to each package card**

Change:
```jsx
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
```
to:
```jsx
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.packages.map((pkg, idx) => (
                    <div key={idx} className="flex flex-col rounded-xl border border-white/5 bg-ink-850/60 p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-cloud-100">{pkg.name}</span>
                        <span className="text-sm font-extrabold text-brand-300">{formatINR(pkg.price)}</span>
                      </div>
                      {pkg.description && (
                        <p className="mt-1.5 text-xs text-cloud-400 leading-relaxed">{pkg.description}</p>
                      )}

                      {pkg.features?.length > 0 && (
                        <ul className="mt-2.5 space-y-1.5 flex-1">
                          {pkg.features.map((feature, fi) => (
                            <li key={fi} className="flex items-start gap-1.5 text-[11px] text-cloud-300">
                              <Check size={11} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-400" />
                              <span className="break-words">{cleanText(feature)}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleBuyNow(pkg)}
                          className="flex-1 rounded-lg bg-brand-gradient px-3 py-2 text-xs font-bold text-white transition hover:opacity-95 cursor-pointer"
                        >
                          Buy Now
                        </button>
                        <button
                          onClick={() => handleAddToCart(pkg)}
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-cloud-100 transition hover:bg-white/10 cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
```

- [ ] **Step 3: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 4: Manual verification**

With both dev servers running (after Tasks 2 and 1's migration have run), open a product's public page:
1. Confirm each package card now shows its feature bullets (from the Task 2 migration) below the description.
2. Confirm each package card has its own "Buy Now" and "Add to Cart" buttons.
3. Click "Add to Cart" on the "Installation" package — go to `/cart` — confirm a line reading `"{Product Name} — Installation"` appears at the **package's** price (not the base product price).
4. Also click the top Buy Box's "Add to Cart" (base product) — confirm it adds as a **separate** cart line (2 lines total now, same product name but no `— Installation` suffix on the base line), and the cart subtotal is the sum of both correctly.
5. Proceed to `/checkout` — confirm both lines and their individual prices show correctly, and the total matches.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProductDetail.jsx
git commit -m "feat: make each product package independently buyable with its own feature checklist"
```

---

### Task 7: Admin — redesign Packages editor with per-package feature bullets

**Files:**
- Modify: `src/admin/pages/products/ProductForm.jsx`

**Interfaces:**
- Produces: `form.packages[i]` now `{ name, price, description, features: [] }`, each field directly editable in place (no separate staging inputs), replacing the prior add-only flat-list editor.

- [ ] **Step 1: Replace the package staging state and handlers**

Change:
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
to:
```jsx
  function addPackageBlock() {
    setForm((f) => ({ ...f, packages: [...f.packages, { name: "", price: 0, description: "", features: [] }] }))
  }

  function updatePackageField(index, field, value) {
    setForm((f) => {
      const packages = [...f.packages]
      packages[index] = { ...packages[index], [field]: value }
      return { ...f, packages }
    })
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

  const [packageFeatureInput, setPackageFeatureInput] = useState({})

  function setPackageFeatureInputValue(index, value) {
    setPackageFeatureInput((m) => ({ ...m, [index]: value }))
  }

  function addPackageFeature(index) {
    const value = (packageFeatureInput[index] || "").trim()
    if (!value) return
    setForm((f) => {
      const packages = [...f.packages]
      packages[index] = { ...packages[index], features: [...(packages[index].features || []), value] }
      return { ...f, packages }
    })
    setPackageFeatureInputValue(index, "")
  }

  function removePackageFeature(packageIndex, featureIndex) {
    setForm((f) => {
      const packages = [...f.packages]
      packages[packageIndex] = {
        ...packages[packageIndex],
        features: packages[packageIndex].features.filter((_, i) => i !== featureIndex),
      }
      return { ...f, packages }
    })
  }

  function movePackageFeature(packageIndex, featureIndex, direction) {
    setForm((f) => {
      const packages = [...f.packages]
      const features = [...(packages[packageIndex].features || [])]
      const swapWith = direction === "up" ? featureIndex - 1 : featureIndex + 1
      if (swapWith < 0 || swapWith >= features.length) return f
      ;[features[featureIndex], features[swapWith]] = [features[swapWith], features[featureIndex]]
      packages[packageIndex] = { ...packages[packageIndex], features }
      return { ...f, packages }
    })
  }
```

- [ ] **Step 2: Include only filled-in packages in the submit payload**

Change:
```jsx
      features: form.features,
      packages: form.packages,
```
to:
```jsx
      features: form.features,
      packages: form.packages
        .filter((p) => p.name.trim())
        .map((p) => ({ ...p, price: Number(p.price) || 0 })),
```

- [ ] **Step 3: Replace the Packages section JSX**

Change:
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
to:
```jsx
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium text-cloud-400">
              Packages <span className="text-cloud-500">(each gets its own Buy Now/Add to Cart and feature checklist on the product page)</span>
            </label>
            <button
              type="button"
              onClick={addPackageBlock}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-300 hover:underline"
            >
              <Plus size={14} /> Add Package
            </button>
          </div>

          <div className="space-y-3">
            {form.packages.map((pkg, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-white/10 bg-ink-800 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      value={pkg.name}
                      onChange={(e) => updatePackageField(i, "name", e.target.value)}
                      placeholder="Package name, e.g. Installation"
                      className="rounded-lg border border-white/10 bg-ink-850 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      value={pkg.price}
                      onChange={(e) => updatePackageField(i, "price", e.target.value)}
                      placeholder="Price"
                      className="rounded-lg border border-white/10 bg-ink-850 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1 pt-1">
                    <button type="button" onClick={() => movePackage(i, "up")} className="grid h-7 w-7 place-items-center rounded text-cloud-400 hover:bg-white/5">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" onClick={() => movePackage(i, "down")} className="grid h-7 w-7 place-items-center rounded text-cloud-400 hover:bg-white/5">
                      <ArrowDown size={14} />
                    </button>
                    <button type="button" onClick={() => removePackage(i)} className="grid h-7 w-7 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <input
                  value={pkg.description}
                  onChange={(e) => updatePackageField(i, "description", e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-lg border border-white/10 bg-ink-850 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-cloud-500">Feature bullet points for this package</label>
                  <div className="flex gap-2">
                    <input
                      value={packageFeatureInput[i] || ""}
                      onChange={(e) => setPackageFeatureInputValue(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addPackageFeature(i)
                        }
                      }}
                      placeholder="e.g. Free lifetime updates"
                      className="flex-1 rounded-lg border border-white/10 bg-ink-850 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addPackageFeature(i)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2.5 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {(pkg.features || []).map((feature, fi) => (
                      <div key={fi} className="flex items-center justify-between rounded-lg bg-ink-850 px-3 py-2 text-sm text-cloud-200">
                        <span className="truncate">{feature}</span>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => movePackageFeature(i, fi, "up")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                            <ArrowUp size={13} />
                          </button>
                          <button type="button" onClick={() => movePackageFeature(i, fi, "down")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                            <ArrowDown size={13} />
                          </button>
                          <button type="button" onClick={() => removePackageFeature(i, fi)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!pkg.features || pkg.features.length === 0) && (
                      <p className="text-xs text-cloud-500">No feature bullets yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {form.packages.length === 0 && (
              <p className="text-xs text-cloud-500">No packages added yet.</p>
            )}
          </div>
        </div>
```

- [ ] **Step 4: Verify the build succeeds**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 5: Manual verification**

With both dev servers running, log into `/admin/products` and open an existing product's edit page:
1. Confirm existing packages (e.g. "Buy Source Code", "Installation") render as blocks with their name/price/description directly editable in place, and their demo feature bullets (from Task 2) listed below.
2. Click "Add Package" — confirm a new blank block appears; fill in a name, price, and add 2 feature bullets via Enter/Add.
3. Reorder package blocks with ▲▼; reorder feature bullets within a block with ▲▼; remove a feature bullet with ✕.
4. Save — reload the edit page — confirm everything (block order, fields, feature bullets in their edited order) persisted.
5. Add a package block but leave its name blank, save — confirm the blank block was silently dropped (not saved) rather than erroring or saving an invalid package.

- [ ] **Step 6: Commit**

```bash
git add src/admin/pages/products/ProductForm.jsx
git commit -m "feat: redesign admin Packages editor with per-package feature bullets"
```

---

### Task 8: Full end-to-end verification

**Files:** none (verification-only task).

- [ ] **Step 1: Final build check**

Run:
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: clean build, no errors.

- [ ] **Step 2: Full regression walkthrough**

With both dev servers running:
1. On a product page, add the base product to cart AND add its "Installation" package to cart. Confirm 2 separate cart lines with correct individual prices and a correctly summed subtotal.
2. Proceed through checkout to the point of submitting an order (or, if avoiding creating a real test order, verify the checkout page's displayed total matches the cart's — this is the same math the backend will use).
3. If a real test order is submitted: check the resulting order (via `/order/:id` or the admin Orders page) shows the package line as `"{Product} — Installation"` at the package's price, not the base price — this is the critical correctness check for Task 5's fix.
4. Confirm removing one cart line (e.g. the Installation package) via the ✕ button leaves the other line (base product) untouched.
5. Confirm a product with no packages at all still renders its page normally (no empty "Available Packages" section, no console errors).

- [ ] **Step 3: Commit (if any leftover changes)**

```bash
git status
```
If clean, no commit needed — this task is verification-only.
