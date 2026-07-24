# Package "Buy on WhatsApp" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-package Buy Now/Add to Cart with a single "Buy on WhatsApp" button (admin-configurable number), and revert the now-unneeded cart/checkout/order package-awareness added earlier this session.

**Architecture:** Revert `CartContext`/`Cart.jsx`/`Checkout.jsx`/`orderController.js` to their pre-package-purchase state. Add `whatsappNumber` to `PaymentSetting`. `ProductDetail.jsx`'s package cards open a `wa.me` deep link instead of touching the cart.

**Tech Stack:** React 19, Mongoose, lucide-react, existing `usePaymentSettings` hook.

## Global Constraints

- The base product's top Buy Box (Buy Now / Add to Cart / Live Preview) must work exactly as it did before this session's package-purchase experiment — verify this explicitly at the end.
- No automated test framework — verify via `vite build` / syntax-load checks plus a manual browser walkthrough.

---

### Task 1: Revert `CartContext.jsx`

**Files:**
- Modify: `src/context/CartContext.jsx`

- [ ] **Step 1: Revert `add`/`remove`/`updateQty`**

Change:
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
to:
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

- [ ] **Step 2: Verify the build succeeds**

Run: `npx vite build --mode development 2>&1 | tail -20` — expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/context/CartContext.jsx
git commit -m "revert: key cart items by productId only (packages no longer go through cart)"
```

---

### Task 2: Revert `Cart.jsx` and `Checkout.jsx`

**Files:**
- Modify: `src/pages/Cart.jsx`
- Modify: `src/pages/Checkout.jsx`

- [ ] **Step 1: Revert `Cart.jsx`**

Change the list key back:
```jsx
              key={`${item.productId}:${item.packageId || "base"}`}
```
to:
```jsx
              key={item.productId}
```

Change the name display back:
```jsx
                  {item.name}{item.packageName ? ` — ${item.packageName}` : ""}
```
to:
```jsx
                  {item.name}
```

Change the quantity buttons back:
```jsx
                  onClick={() => updateQty(item.productId, item.qty - 1, item.packageId)}
```
to:
```jsx
                  onClick={() => updateQty(item.productId, item.qty - 1)}
```
and:
```jsx
                  onClick={() => updateQty(item.productId, item.qty + 1, item.packageId)}
```
to:
```jsx
                  onClick={() => updateQty(item.productId, item.qty + 1)}
```

Change the remove button back:
```jsx
                onClick={() => remove(item.productId, item.packageId)}
```
to:
```jsx
                onClick={() => remove(item.productId)}
```

- [ ] **Step 2: Revert `Checkout.jsx`**

Change the summary list back:
```jsx
              <div key={`${item.productId}:${item.packageId || "base"}`} className="flex justify-between text-sm text-cloud-400">
                <span className="min-w-0 truncate pr-3">{item.name}{item.packageName ? ` — ${item.packageName}` : ""} × {item.qty}</span>
```
to:
```jsx
              <div key={item.productId} className="flex justify-between text-sm text-cloud-400">
                <span className="min-w-0 truncate pr-3">{item.name} × {item.qty}</span>
```

Change the submit payload back:
```jsx
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, packageId: i.packageId })),
```
to:
```jsx
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
```

- [ ] **Step 3: Verify the build succeeds**

Run: `npx vite build --mode development 2>&1 | tail -20` — expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Cart.jsx src/pages/Checkout.jsx
git commit -m "revert: remove package display/wiring from cart and checkout"
```

---

### Task 3: Revert `orderController.js`

**Files:**
- Modify: `server/src/controllers/orderController.js`

- [ ] **Step 1: Revert the order-item mapping**

Change:
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
to:
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

- [ ] **Step 2: Verify the controller loads cleanly**

Run:
```bash
cd server && node --input-type=module -e "import * as c from './src/controllers/orderController.js'; console.log(typeof c.createOrder)"
```
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/orderController.js
git commit -m "revert: order pricing no longer needs package lookup"
```

---

### Task 4: WhatsApp number setting

**Files:**
- Modify: `server/src/models/PaymentSetting.js`
- Modify: `server/src/controllers/paymentSettingController.js`
- Modify: `src/admin/pages/Settings.jsx`

**Interfaces:**
- Produces: `PaymentSetting.whatsappNumber` (string) — consumed by Task 5 (`ProductDetail.jsx`).

- [ ] **Step 1: Add the field to the model**

Change:
```js
    upiId: { type: String, default: "" },
    payeeName: { type: String, default: "" },
```
to:
```js
    upiId: { type: String, default: "" },
    payeeName: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
```

- [ ] **Step 2: Pass it through the controller**

Change:
```js
export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const { upiId, payeeName, qrImage, note } = req.body
  const settings = await PaymentSetting.findOneAndUpdate(
    {},
    { upiId, payeeName, qrImage, note },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  res.json(settings)
})
```
to:
```js
export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const { upiId, payeeName, qrImage, note, whatsappNumber } = req.body
  const settings = await PaymentSetting.findOneAndUpdate(
    {},
    { upiId, payeeName, qrImage, note, whatsappNumber },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  res.json(settings)
})
```

- [ ] **Step 3: Add the admin field**

In `src/admin/pages/Settings.jsx`, change the initial form state:
```jsx
  const [form, setForm] = useState({ upiId: "", payeeName: "", note: "" })
```
to:
```jsx
  const [form, setForm] = useState({ upiId: "", payeeName: "", note: "", whatsappNumber: "" })
```

Change the load effect:
```jsx
    setForm({
      upiId: settings.upiId || "",
      payeeName: settings.payeeName || "",
      note: settings.note || "",
    })
```
to:
```jsx
    setForm({
      upiId: settings.upiId || "",
      payeeName: settings.payeeName || "",
      note: settings.note || "",
      whatsappNumber: settings.whatsappNumber || "",
    })
```

Add a new field right after the "Payee Name" input block:
```jsx
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            WhatsApp Number <span className="text-cloud-500">(with country code, e.g. 919876543210 — used for the "Buy on WhatsApp" button on package cards)</span>
          </label>
          <input
            value={form.whatsappNumber}
            onChange={(e) => setField("whatsappNumber", e.target.value)}
            placeholder="919876543210"
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
          />
        </div>
```

- [ ] **Step 4: Verify**

Run:
```bash
cd server && node --input-type=module -e "import P from './src/models/PaymentSetting.js'; console.log(Object.keys(P.schema.paths).includes('whatsappNumber'))"
```
Expected: `true`

Run (from repo root): `npx vite build --mode development 2>&1 | tail -20` — expected: no errors.

- [ ] **Step 5: Manual verification**

With both dev servers running, log into `/admin/settings`, enter a WhatsApp number (e.g. your own test number in `91XXXXXXXXXX` format), save, reload the page, confirm it persisted.

- [ ] **Step 6: Commit**

```bash
git add server/src/models/PaymentSetting.js server/src/controllers/paymentSettingController.js src/admin/pages/Settings.jsx
git commit -m "feat: add WhatsApp number to payment settings"
```

---

### Task 5: Product page — "Buy on WhatsApp" per package, revert base Buy Box helpers

**Files:**
- Modify: `src/pages/ProductDetail.jsx`

**Interfaces:**
- Consumes: `usePaymentSettings` (`src/hooks/usePaymentSettings.js`, same hook already used by `Checkout.jsx`).

- [ ] **Step 1: Revert `cartItem`/`handleAddToCart`/`handleBuyNow` to their no-argument form**

Change:
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
to:
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

- [ ] **Step 2: Restore the top Buy Box's plain onClick bindings**

Change:
```jsx
                <button
                  onClick={() => handleBuyNow()}
```
to:
```jsx
                <button
                  onClick={handleBuyNow}
```

Change:
```jsx
                  <button
                    onClick={() => handleAddToCart()}
```
to:
```jsx
                  <button
                    onClick={handleAddToCart}
```

(These are safe to bind directly again now that both functions take no parameters.)

- [ ] **Step 3: Add the `usePaymentSettings` import and a WhatsApp link helper**

Change:
```jsx
import { useProduct } from "../hooks/useProducts"
import { useCart } from "../context/CartContext"
```
to:
```jsx
import { useProduct } from "../hooks/useProducts"
import { useCart } from "../context/CartContext"
import { usePaymentSettings } from "../hooks/usePaymentSettings"
```

Add `MessageCircle` to the existing lucide-react import block. Change:
```jsx
  ChevronDown,
  ChevronUp,
  Package
} from "lucide-react"
```
to:
```jsx
  ChevronDown,
  ChevronUp,
  Package,
  MessageCircle
} from "lucide-react"
```

Inside the component, after `const { data: product, isLoading } = useProduct(slug)`, add:
```jsx
  const { data: paymentSettings } = usePaymentSettings()
```

Add a helper function near `cartItem`/`handleAddToCart`:
```jsx
  function whatsappLinkFor(pkg) {
    const number = (paymentSettings?.whatsappNumber || "").replace(/\D/g, "")
    if (!number) return null
    const message = `Hi! I'm interested in buying "${pkg.name}" for "${product.name}" (${formatINR(pkg.price)}).\n${window.location.href}`
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  }
```

- [ ] **Step 4: Replace the package card's action buttons with a single WhatsApp button**

Change:
```jsx
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
```
to:
```jsx
                      {whatsappLinkFor(pkg) && (
                        <a
                          href={whatsappLinkFor(pkg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 cursor-pointer"
                        >
                          <MessageCircle size={14} /> Buy on WhatsApp
                        </a>
                      )}
```

- [ ] **Step 5: Verify the build succeeds**

Run: `npx vite build --mode development 2>&1 | tail -20` — expected: no errors.

- [ ] **Step 6: Manual verification**

With both dev servers running (and a WhatsApp number saved via Task 4):
1. Open a product's public page — confirm each package card shows a green "Buy on WhatsApp" button instead of Buy Now/Add to Cart.
2. Click it — confirm it opens `wa.me/<your test number>` in a new tab with a pre-filled message naming the correct package, product, and price.
3. Confirm the top Buy Box's Buy Now / Add to Cart still work exactly as before (base product price, no package context) — add to cart, check `/cart` shows the correct single line at the base price.
4. Temporarily clear the WhatsApp number in Settings, reload the product page, confirm the "Buy on WhatsApp" button is simply absent from each package card (no broken link, no crash).
5. Restore the WhatsApp number afterward.

- [ ] **Step 7: Commit**

```bash
git add src/pages/ProductDetail.jsx
git commit -m "feat: replace package Buy Now/Add to Cart with a Buy on WhatsApp button"
```

---

### Task 6: Full end-to-end verification

**Files:** none (verification-only task).

- [ ] **Step 1: Final build check**

Run: `npx vite build --mode development 2>&1 | tail -20` — expected: clean build.

- [ ] **Step 2: Regression walkthrough**

1. Confirm base product Buy Now/Add to Cart/cart/checkout all work exactly as they did before this session's package-purchase detour (no package context anywhere in that flow).
2. Confirm package cards show feature bullets + a single "Buy on WhatsApp" button, correctly disabled/hidden when no WhatsApp number is configured.
3. Confirm no leftover references to `packageId`/`packageName` remain in `CartContext.jsx`, `Cart.jsx`, `Checkout.jsx`, or `orderController.js` (grep for `packageId` across `src/` and `server/src/` should only match `ProductDetail.jsx`'s `whatsappLinkFor` usage of `pkg` — not `packageId` — and the `Product.js` model's package subdocuments themselves).

- [ ] **Step 3: Commit (if any leftover changes)**

Run `git status` — if clean, no commit needed.
