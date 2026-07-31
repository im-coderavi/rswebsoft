# Coupon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admin create discount coupons (percentage or fixed ₹, scoped to all products or specific products, with expiry/usage/min-order rules), and let customers redeem a code at Cart/Checkout for a discount that is authoritatively recomputed server-side at order creation.

**Architecture:** A `Coupon` model + a shared `resolveCoupon()` service function used by both a public "preview" endpoint (`POST /api/coupons/apply`, called from the Cart/Checkout UI as the customer types a code) and by `createOrder` (which re-validates and applies the discount for real, never trusting a client-sent discount amount). Admin manages coupons through a standard list+modal-form admin page. The storefront cart persists the applied coupon code across Cart → Checkout in `CartContext`/localStorage, alongside the existing cart items.

**Tech Stack:** Express + Mongoose (server), React + react-query + axios (client), Tailwind, react-hot-toast. No test framework is configured in this repo (no jest/vitest/mocha) — verification steps in this plan are manual (curl for API-only tasks, browser for UI tasks), matching how the rest of the codebase is verified.

## Global Constraints

- Never trust a client-sent discount amount — the server always recomputes it from `resolveCoupon()` at order creation, exactly like item prices are already recomputed from the live `Product` record (see [orderController.js](../../../server/src/controllers/orderController.js)).
- Coupon `usedCount` increments only when an `Order` is actually created — never on a preview/apply call.
- A coupon scoped to specific products discounts only the matching cart items; unrelated items in the same cart are unaffected and the coupon remains usable.
- Follow existing patterns exactly: controller/route/model shape mirrors [brandController.js](../../../server/src/controllers/brandController.js)/[brandRoutes.js](../../../server/src/routes/brandRoutes.js); admin list+modal UI mirrors [BrandList.jsx](../../../src/admin/pages/brands/BrandList.jsx) and the product-search picker in [HomeSectionList.jsx](../../../src/admin/pages/sections/HomeSectionList.jsx); react-query hooks mirror [useOrders.js](../../../src/hooks/useOrders.js).
- Admin login for manual API testing: `admin@rswebsoft.com` / `ChangeMe123!` (from `server/.env`).
- Run the server from `rswebsoft/server` with `npm run dev`, and the client from `rswebsoft` with `npm run dev`, for manual verification steps.

---

### Task 1: `Coupon` model

**Files:**
- Create: `server/src/models/Coupon.js`

**Interfaces:**
- Produces: `Coupon` mongoose model with fields `code, discountType, discountValue, appliesTo, products, expiresAt, usageLimit, usedCount, perCustomerLimit, minOrderValue, status, createdAt, updatedAt`. Later tasks import this as `import Coupon from "../models/Coupon.js"`.

- [ ] **Step 1: Write the model**

```js
import mongoose from "mongoose"
import { ApiError } from "../utils/apiError.js"

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["all", "products"], default: "all" },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Boolean, default: false },
    minOrderValue: { type: Number, default: null, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
)

couponSchema.pre("validate", function (next) {
  if (this.discountType === "percentage" && this.discountValue > 100) {
    return next(new ApiError(400, "Percentage discount cannot exceed 100"))
  }
  if (this.appliesTo === "products" && this.products.length === 0) {
    return next(new ApiError(400, "Select at least one product for a product-specific coupon"))
  }
  next()
})

export default mongoose.model("Coupon", couponSchema)
```

- [ ] **Step 2: Verify it loads without error**

Run (from `rswebsoft/server`): `node -e "import('./src/models/Coupon.js').then(() => console.log('OK')).catch(e => { console.error(e); process.exit(1) })"`
Expected: prints `OK` (this only checks the file parses and the schema definition doesn't throw — no DB connection needed for this check).

- [ ] **Step 3: Commit**

```bash
git add server/src/models/Coupon.js
git commit -m "feat: add Coupon model"
```

---

### Task 2: Extract shared `buildPricedItems` pricing service

**Why:** `createOrder` currently inlines "fetch live products for cart item ids, validate they all exist and are published, map to `{product, name, price, qty}`". The new `/api/coupons/apply` endpoint (Task 4) needs the exact same logic to compute a coupon's discount against live prices. Extracting it now avoids two divergent copies of price-trust logic.

**Files:**
- Create: `server/src/services/pricingService.js`
- Modify: `server/src/controllers/orderController.js:127-156` (the top of `createOrder`)

**Interfaces:**
- Produces: `buildPricedItems(items)` — `items` is `[{ productId: string, qty: number }]`; returns `Promise<[{ product: ObjectId, name: string, price: number, qty: number }]>`; throws `ApiError(400, "One or more items are no longer available")` if any `productId` doesn't resolve to a published product. Later tasks (3, 4, 5) import this as `import { buildPricedItems } from "../services/pricingService.js"`.

- [ ] **Step 1: Create the service**

```js
import { ApiError } from "../utils/apiError.js"
import Product from "../models/Product.js"

// Recomputes item prices from the live Product record — client-sent prices
// are never trusted. Used by order creation and by coupon discount
// calculation, which both need the same "what does this cart actually cost"
// answer.
export async function buildPricedItems(items) {
  const productIds = items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: productIds }, status: "published" })

  if (products.length !== new Set(productIds).size) {
    throw new ApiError(400, "One or more items are no longer available")
  }

  const productById = new Map(products.map((p) => [String(p._id), p]))
  return items.map((i) => {
    const product = productById.get(i.productId)
    const qty = Math.max(1, Number(i.qty) || 1)
    return {
      product: product._id,
      name: product.name,
      price: product.salePrice ?? product.price,
      qty,
    }
  })
}
```

- [ ] **Step 2: Use it from `createOrder`**

In `server/src/controllers/orderController.js`, add the import at the top:

```js
import { buildPricedItems } from "../services/pricingService.js"
```

Replace this block inside `createOrder` (currently lines ~137-154):

```js
  const productIds = items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: productIds }, status: "published" })

  if (products.length !== new Set(productIds).size) {
    throw new ApiError(400, "One or more items are no longer available")
  }

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

with:

```js
  const orderItems = await buildPricedItems(items)
```

`Product` is no longer referenced directly in `orderController.js` after this change — remove its now-unused `import Product from "../models/Product.js"` line from the top of the file.

- [ ] **Step 3: Manually verify checkout still works**

Start both servers (`npm run dev` in `rswebsoft/server`, `npm run dev` in `rswebsoft`). In the browser: log in as a customer, add a product to the cart, go through Checkout, submit the order. Expected: order is created successfully and you land on the order-tracking page with the correct total — i.e. no behavior change from before this refactor.

- [ ] **Step 4: Commit**

```bash
git add server/src/services/pricingService.js server/src/controllers/orderController.js
git commit -m "refactor: extract buildPricedItems into a shared pricing service"
```

---

### Task 3: Coupon resolution service

**Files:**
- Create: `server/src/services/couponService.js`

**Interfaces:**
- Consumes: `Coupon` model (Task 1), `Order` model (existing, will gain `couponCode` in Task 5 — the field read here (`Order.exists({ user, couponCode })`) only returns meaningful results once Task 5 ships, which is fine since `resolveCoupon` isn't called from any route until Task 4).
- Produces: `resolveCoupon(code, pricedItems, userId)` — `pricedItems` is the array shape produced by `buildPricedItems` (`{ product, name, price, qty }`), `userId` is a string ObjectId or `null`/`undefined`. Returns `Promise<{ coupon: CouponDoc, discountAmount: number, matchedProductIds: string[] }>`, or throws `ApiError(400, <reason>)`. Used by Task 4 (`applyCoupon` controller) and Task 5 (`createOrder`).

- [ ] **Step 1: Write the service**

```js
import { ApiError } from "../utils/apiError.js"
import Coupon from "../models/Coupon.js"
import Order from "../models/Order.js"

// Single source of truth for "is this coupon usable, and what does it save".
// Called both by the public preview endpoint (apply-as-you-type at
// checkout) and by order creation (authoritative, re-checked server-side)
// so the two can never disagree about whether a coupon is valid.
export async function resolveCoupon(code, pricedItems, userId) {
  const normalized = String(code || "").trim().toUpperCase()
  if (!normalized) {
    throw new ApiError(400, "Coupon code is required")
  }

  const coupon = await Coupon.findOne({ code: normalized })
  if (!coupon || coupon.status !== "active") {
    throw new ApiError(400, "Invalid coupon code")
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "This coupon has expired")
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "This coupon has reached its usage limit")
  }
  if (coupon.perCustomerLimit && userId) {
    const alreadyUsed = await Order.exists({ user: userId, couponCode: normalized })
    if (alreadyUsed) {
      throw new ApiError(400, "You have already used this coupon")
    }
  }

  const matchedItems =
    coupon.appliesTo === "all"
      ? pricedItems
      : pricedItems.filter((item) =>
          coupon.products.some((productId) => String(productId) === String(item.product))
        )

  if (matchedItems.length === 0) {
    throw new ApiError(400, "This coupon isn't valid for the items in your cart")
  }

  const matchedSubtotal = matchedItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  if (coupon.minOrderValue != null && matchedSubtotal < coupon.minOrderValue) {
    throw new ApiError(400, `This coupon requires a minimum order of ₹${coupon.minOrderValue}`)
  }

  const discountAmount =
    coupon.discountType === "percentage"
      ? Math.round((matchedSubtotal * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, matchedSubtotal)

  return {
    coupon,
    discountAmount,
    matchedProductIds: matchedItems.map((item) => String(item.product)),
  }
}
```

- [ ] **Step 2: Verify it loads without error**

Run (from `rswebsoft/server`): `node -e "import('./src/services/couponService.js').then(() => console.log('OK')).catch(e => { console.error(e); process.exit(1) })"`
Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/couponService.js
git commit -m "feat: add resolveCoupon service for coupon validation and discount calculation"
```

---

### Task 4: Coupon controller, routes, and app registration

**Files:**
- Create: `server/src/controllers/couponController.js`
- Create: `server/src/routes/couponRoutes.js`
- Modify: `server/src/app.js`

**Interfaces:**
- Consumes: `buildPricedItems` (Task 2), `resolveCoupon` (Task 3), `Coupon` model (Task 1), existing `protect`/`adminOnly` middleware ([auth.js](../../../server/src/middleware/auth.js)).
- Produces: `GET/POST /api/coupons` (admin), `PUT/DELETE /api/coupons/:id` (admin), `POST /api/coupons/apply` (public) — consumed by the admin UI (Task 7) and the storefront `CartContext` (Task 8).

- [ ] **Step 1: Write the controller**

```js
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Coupon from "../models/Coupon.js"
import User from "../models/User.js"
import { buildPricedItems } from "../services/pricingService.js"
import { resolveCoupon } from "../services/couponService.js"

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).populate("products", "name")
  res.json(coupons)
})

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body)
  res.status(201).json(coupon)
})

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) throw new ApiError(404, "Coupon not found")

  Object.assign(coupon, req.body)
  await coupon.save()
  res.json(coupon)
})

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id)
  if (!coupon) throw new ApiError(404, "Coupon not found")
  res.json({ message: "Coupon deleted" })
})

// The Cart page (unlike Checkout) is reachable while logged out, so this
// endpoint can't require auth outright. It still attaches the user id when a
// valid token IS present, so the per-customer-limit check works for signed-in
// shoppers previewing a coupon on the Cart page. A missing/invalid token just
// means that one check is skipped for this preview call — it's re-enforced
// unconditionally at order creation, which does require login.
async function optionalUserId(req) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) return null
  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET)
    const user = await User.findById(payload.id)
    return user ? String(user._id) : null
  } catch {
    return null
  }
}

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, items } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Cart is empty")
  }

  const pricedItems = await buildPricedItems(items)
  const userId = await optionalUserId(req)
  const { discountAmount, matchedProductIds } = await resolveCoupon(code, pricedItems, userId)

  res.json({ discountAmount, matchedProductIds })
})
```

- [ ] **Step 2: Write the routes**

```js
import { Router } from "express"
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, applyCoupon } from "../controllers/couponController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listCoupons)
router.post("/", protect, adminOnly, createCoupon)
router.put("/:id", protect, adminOnly, updateCoupon)
router.delete("/:id", protect, adminOnly, deleteCoupon)
router.post("/apply", applyCoupon)

export default router
```

- [ ] **Step 3: Register the route in `app.js`**

Add the import near the other route imports:

```js
import couponRoutes from "./routes/couponRoutes.js"
```

Add the mount line near the other `app.use("/api/...")` lines:

```js
app.use("/api/coupons", couponRoutes)
```

- [ ] **Step 4: Manually verify via curl**

Start the server (`npm run dev` in `rswebsoft/server`). Then, from any shell:

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rswebsoft.com","password":"ChangeMe123!"}' | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")

curl -s -X POST http://localhost:5000/api/coupons \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"code":"TEST10","discountType":"percentage","discountValue":10,"appliesTo":"all"}'
```

(Adjust the port to whatever `server/.env`'s `PORT` is set to if not 5000.)

Expected: the create call returns a 201 JSON body with `"code":"TEST10"`. Then:

```bash
curl -s http://localhost:5000/api/coupons -H "Authorization: Bearer $TOKEN"
```

Expected: a JSON array containing the `TEST10` coupon. Leave this coupon in place — Task 5's manual test reuses it.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/couponController.js server/src/routes/couponRoutes.js server/src/app.js
git commit -m "feat: add coupon CRUD and apply API endpoints"
```

---

### Task 5: Wire coupons into order creation

**Files:**
- Modify: `server/src/models/Order.js`
- Modify: `server/src/controllers/orderController.js`

**Interfaces:**
- Consumes: `resolveCoupon` (Task 3), `Coupon` model (Task 1).
- Produces: `Order.couponCode: string`, `Order.discountAmount: number` — consumed by `trackOrder` (already passes through via `order.toObject()`, no code change needed there), the admin Orders list (Task 12), `OrderTrack.jsx` (Task 12), and the delivery email (Task 13).

- [ ] **Step 1: Add fields to the `Order` model**

In `server/src/models/Order.js`, add these two fields to `orderSchema` (next to `paymentReference`):

```js
    couponCode: { type: String, default: "", trim: true, uppercase: true },
    discountAmount: { type: Number, default: 0, min: 0 },
```

- [ ] **Step 2: Apply the coupon in `createOrder`**

In `server/src/controllers/orderController.js`, add these imports at the top:

```js
import { resolveCoupon } from "../services/couponService.js"
import Coupon from "../models/Coupon.js"
```

Replace the body of `createOrder` from the `total` calculation through `Order.create` (currently):

```js
  const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  const order = await Order.create({
    user: req.user._id,
    customer,
    items: orderItems,
    total,
    paymentReference: paymentReference || "",
  })
```

with:

```js
  const { couponCode } = req.body
  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  let discountAmount = 0
  let appliedCoupon = null
  if (couponCode) {
    const resolved = await resolveCoupon(couponCode, orderItems, req.user._id)
    appliedCoupon = resolved.coupon
    discountAmount = resolved.discountAmount
  }

  const order = await Order.create({
    user: req.user._id,
    customer,
    items: orderItems,
    total: subtotal - discountAmount,
    couponCode: appliedCoupon?.code || "",
    discountAmount,
    paymentReference: paymentReference || "",
  })

  if (appliedCoupon) {
    await Coupon.updateOne({ _id: appliedCoupon._id }, { $inc: { usedCount: 1 } })
  }
```

Leave the rest of `createOrder` (the background admin-notification email call and the `res.status(201).json(order)`) unchanged — this substitution only replaces the total/create block.

- [ ] **Step 3: Manually verify end-to-end**

With both servers running and the `TEST10` coupon from Task 4 still in the database:

```bash
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<a real customer account email/password from your dev DB>"}' | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")
```

(If you don't have a customer account handy, register one via the storefront's `/register` page first, or use the browser instead of curl for this whole verification — log in as a customer, add an item to the cart, and continue with the browser network tab to inspect the `POST /api/orders` request/response.)

```bash
curl -s -X POST http://localhost:5000/api/coupons/apply \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST10","items":[{"productId":"<a real published product _id>","qty":1}]}'
```

Expected: `{"discountAmount": <10% of that product's price>, "matchedProductIds": ["<that product id>"]}`.

Then create an order with `couponCode: "TEST10"` (via the same product id, `paymentReference` any string, and a valid `customer` object) either via curl with `Authorization: Bearer $CUSTOMER_TOKEN` or via the storefront checkout UI once Task 11 exists. Expected: the created order's `total` is `subtotal - discountAmount`, and `GET /api/coupons` (as admin) now shows `TEST10` with `usedCount: 1`.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/Order.js server/src/controllers/orderController.js
git commit -m "feat: apply and track coupon discounts on order creation"
```

---

### Task 6: Frontend coupon hooks

**Files:**
- Create: `src/hooks/useCoupons.js`

**Interfaces:**
- Consumes: `api` client ([lib/api.js](../../../src/lib/api.js)).
- Produces: `useCoupons()`, `useCreateCoupon()`, `useUpdateCoupon()`, `useDeleteCoupon()` (admin react-query hooks, consumed by Task 7's `CouponList.jsx`) and `applyCouponRequest(code, items)` (a plain async function, not a hook — consumed by Task 8's `CartContext`, which owns the applied-coupon state itself rather than a react-query cache).

- [ ] **Step 1: Write the hooks file**

```js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => (await api.get("/coupons")).data,
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.post("/coupons", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await api.put(`/coupons/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/coupons/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  })
}

// Imperative call (not cached) — CartContext calls this directly and stores
// the result itself, since "the currently applied coupon" is cart state, not
// server-fetched data to cache.
export async function applyCouponRequest(code, items) {
  const { data } = await api.post("/coupons/apply", { code, items })
  return data
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCoupons.js
git commit -m "feat: add coupon react-query hooks and apply-coupon request helper"
```

---

### Task 7: Admin Coupons page

**Files:**
- Create: `src/admin/pages/coupons/CouponList.jsx`
- Modify: `src/admin/navConfig.js`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useCoupons`, `useCreateCoupon`, `useUpdateCoupon`, `useDeleteCoupon` (Task 6); `useProducts` (existing, [useProducts.js](../../../src/hooks/useProducts.js)); `DataTable`, `ConfirmDialog` (existing admin components).

- [ ] **Step 1: Write `CouponList.jsx`**

```jsx
import { useState } from "react"
import { Plus, Pencil, Trash2, Search, X } from "lucide-react"
import toast from "react-hot-toast"
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "../../../hooks/useCoupons"
import { useProducts } from "../../../hooks/useProducts"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"
import ConfirmDialog from "../../components/ConfirmDialog"

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  appliesTo: "all",
  products: [],
  expiresAt: "",
  usageLimit: "",
  perCustomerLimit: false,
  minOrderValue: "",
  status: "active",
}

export default function CouponList() {
  const { data: coupons, isLoading } = useCoupons()
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const deleteCoupon = useDeleteCoupon()

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

  function openEdit(coupon) {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      appliesTo: coupon.appliesTo,
      products: coupon.products || [],
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      perCustomerLimit: Boolean(coupon.perCustomerLimit),
      minOrderValue: coupon.minOrderValue != null ? String(coupon.minOrderValue) : "",
      status: coupon.status,
    })
    setModalOpen(true)
  }

  function addProduct(product) {
    if (form.products.some((p) => (p._id || p) === product._id)) return
    setForm((f) => ({ ...f, products: [...f.products, product] }))
    setProductQuery("")
  }

  function removeProduct(productId) {
    setForm((f) => ({ ...f, products: f.products.filter((p) => (p._id || p) !== productId) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      appliesTo: form.appliesTo,
      products: form.appliesTo === "products" ? form.products.map((p) => p._id || p) : [],
      expiresAt: form.expiresAt || null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perCustomerLimit: form.perCustomerLimit,
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
      status: form.status,
    }
    try {
      if (editing) {
        await updateCoupon.mutateAsync({ id: editing._id, ...payload })
        toast.success("Coupon updated")
      } else {
        await createCoupon.mutateAsync(payload)
        toast.success("Coupon created")
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function confirmDelete() {
    try {
      await deleteCoupon.mutateAsync(pendingDelete._id)
      toast.success("Coupon deleted")
      setPendingDelete(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const saving = createCoupon.isPending || updateCoupon.isPending

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (c) => <span className="font-mono font-semibold text-cloud-100">{c.code}</span>,
    },
    {
      key: "discount",
      label: "Discount",
      render: (c) => (c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`),
    },
    {
      key: "appliesTo",
      label: "Scope",
      render: (c) =>
        c.appliesTo === "all"
          ? "All Products"
          : `${c.products?.length || 0} Product${c.products?.length === 1 ? "" : "s"}`,
    },
    {
      key: "usage",
      label: "Used",
      render: (c) => (c.usageLimit != null ? `${c.usedCount} / ${c.usageLimit}` : `${c.usedCount}`),
    },
    {
      key: "status",
      label: "Status",
      render: (c) => {
        const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()
        const label = expired ? "Expired" : c.status === "active" ? "Active" : "Inactive"
        const style = expired
          ? "bg-rose-500/15 text-rose-400"
          : c.status === "active"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-ink-700 text-cloud-400"
        return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>
      },
    },
    {
      key: "expiresAt",
      label: "Expires",
      render: (c) => (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"),
    },
  ]

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={coupons || []}
        loading={isLoading}
        emptyMessage="No coupons yet."
        actions={(c) => (
          <>
            <button
              onClick={() => openEdit(c)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-ink-800 hover:text-cloud-100"
              aria-label="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setPendingDelete(c)}
              className="grid h-8 w-8 place-items-center rounded-lg text-cloud-400 transition hover:bg-rose-500/15 hover:text-rose-400"
              aria-label="Delete"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto" onClick={() => setModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-ink-850 p-6 my-8"
          >
            <h2 className="font-display text-base font-bold text-cloud-100">
              {editing ? "Edit Coupon" : "New Coupon"}
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Coupon Code</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WELCOME10"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm font-mono text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">Discount Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                  {form.discountType === "percentage" ? "Percent Off" : "Amount Off (₹)"}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max={form.discountType === "percentage" ? "100" : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">Applies To</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-cloud-300">
                  <input
                    type="radio"
                    checked={form.appliesTo === "all"}
                    onChange={() => setForm((f) => ({ ...f, appliesTo: "all" }))}
                    className="h-4 w-4 border-white/20 bg-ink-800"
                  />
                  All Products
                </label>
                <label className="flex items-center gap-2 text-sm text-cloud-300">
                  <input
                    type="radio"
                    checked={form.appliesTo === "products"}
                    onChange={() => setForm((f) => ({ ...f, appliesTo: "products" }))}
                    className="h-4 w-4 border-white/20 bg-ink-800"
                  />
                  Specific Products
                </label>
              </div>
            </div>

            {form.appliesTo === "products" && (
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
                        onClick={() => addProduct(p)}
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm text-cloud-200 hover:bg-white/5"
                      >
                        {p.name}
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  {form.products.map((p) => (
                    <div key={p._id || p} className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm text-cloud-200">
                      <span className="truncate">{p.name || p}</span>
                      <button type="button" onClick={() => removeProduct(p._id || p)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {form.products.length === 0 && (
                    <p className="text-xs text-cloud-500">No products added yet. Search above to add some.</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                  Expiry Date <span className="text-cloud-500">(optional)</span>
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                  Usage Limit <span className="text-cloud-500">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="Unlimited"
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Minimum Order Value (₹) <span className="text-cloud-500">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.minOrderValue}
                onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
                placeholder="No minimum"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-cloud-300">
              <input
                type="checkbox"
                checked={form.perCustomerLimit}
                onChange={(e) => setForm((f) => ({ ...f, perCustomerLimit: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-ink-800"
              />
              Limit to one use per customer
            </label>

            <label className="flex items-center gap-2 text-sm text-cloud-300">
              <input
                type="checkbox"
                checked={form.status === "active"}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "active" : "inactive" }))}
                className="h-4 w-4 rounded border-white/20 bg-ink-800"
              />
              Active
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
        title="Delete coupon?"
        message={`This will permanently delete "${pendingDelete?.code}".`}
        busy={deleteCoupon.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
```

- [ ] **Step 2: Add the nav entry**

In `src/admin/navConfig.js`, add `Ticket` to the lucide-react import list at the top:

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
  Ticket,
} from "lucide-react"
```

Add a new link to the `"Sales"` section:

```js
  {
    label: "Sales",
    links: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { to: "/admin/coupons", label: "Coupons", icon: Ticket },
      { to: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
```

- [ ] **Step 3: Register the route**

In `src/App.jsx`, add the import near the other admin page imports:

```js
import CouponList from "./admin/pages/coupons/CouponList"
```

Add the route inside the `/admin` route block, near `orders`:

```jsx
                <Route path="orders" element={<OrderList />} />
                <Route path="coupons" element={<CouponList />} />
```

- [ ] **Step 4: Manually verify in the browser**

Start both servers, log into `/admin/login` as `admin@rswebsoft.com` / `ChangeMe123!`, open the new "Coupons" sidebar link under Sales. Create a coupon with "Specific Products" scope (search and add a product), save it, confirm it appears in the table with the right Scope/Discount columns, edit it, then delete it.

- [ ] **Step 5: Commit**

```bash
git add src/admin/pages/coupons/CouponList.jsx src/admin/navConfig.js src/App.jsx
git commit -m "feat: add admin Coupons management page"
```

---

### Task 8: `CartContext` coupon state

**Files:**
- Modify: `src/context/CartContext.jsx`

**Interfaces:**
- Consumes: `applyCouponRequest` (Task 6).
- Produces: `useCart()` gains `coupon` (`null | { code, discountAmount, matchedProductIds }`), `applyCoupon(code)` (async, throws on failure), `removeCoupon()`, `discountAmount` (number, `0` when no coupon), `total` (number, `subtotal - discountAmount`), `couponWarning` (string | null), `clearCouponWarning()`. Consumed by `CouponBox` (Task 9), `Cart.jsx` (Task 10), `Checkout.jsx` (Task 11).

- [ ] **Step 1: Rewrite the file**

```jsx
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react"
import { applyCouponRequest } from "../hooks/useCoupons"

const CartContext = createContext(null)
const STORAGE_KEY = "rs_cart"
const COUPON_STORAGE_KEY = "rs_cart_coupon"

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadCoupon() {
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [coupon, setCoupon] = useState(loadCoupon)
  const [couponWarning, setCouponWarning] = useState(null)
  const isFirstItemsRender = useRef(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (coupon) localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon))
    else localStorage.removeItem(COUPON_STORAGE_KEY)
  }, [coupon])

  // Re-validate the applied coupon whenever cart contents change (qty edits,
  // removals): a coupon that was valid can become invalid after an edit
  // (minimum order value no longer met, or its only matching product was
  // removed), so the shown discount must never go stale.
  useEffect(() => {
    if (isFirstItemsRender.current) {
      isFirstItemsRender.current = false
      return
    }
    if (!coupon) return

    const payloadItems = items.map((i) => ({ productId: i.productId, qty: i.qty }))
    if (payloadItems.length === 0) {
      setCoupon(null)
      return
    }

    applyCouponRequest(coupon.code, payloadItems)
      .then((result) => {
        setCoupon((prev) =>
          prev ? { ...prev, discountAmount: result.discountAmount, matchedProductIds: result.matchedProductIds } : prev
        )
      })
      .catch((err) => {
        setCoupon(null)
        setCouponWarning(err?.response?.data?.message || "Your coupon no longer applies to this cart and was removed")
      })
    // Only re-run when items change — coupon itself is updated inside this
    // effect, so including it would create a self-triggering loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

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

  const clear = useCallback(() => {
    setItems([])
    setCoupon(null)
  }, [])

  const applyCoupon = useCallback(
    async (code) => {
      const payloadItems = items.map((i) => ({ productId: i.productId, qty: i.qty }))
      const result = await applyCouponRequest(code, payloadItems)
      setCoupon({
        code: code.trim().toUpperCase(),
        discountAmount: result.discountAmount,
        matchedProductIds: result.matchedProductIds,
      })
    },
    [items]
  )

  const removeCoupon = useCallback(() => setCoupon(null), [])
  const clearCouponWarning = useCallback(() => setCouponWarning(null), [])

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    [items]
  )

  const discountAmount = coupon?.discountAmount || 0
  const total = subtotal - discountAmount

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        updateQty,
        clear,
        count,
        subtotal,
        coupon,
        applyCoupon,
        removeCoupon,
        discountAmount,
        total,
        couponWarning,
        clearCouponWarning,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/CartContext.jsx
git commit -m "feat: add coupon state, apply/remove actions, and auto-revalidation to CartContext"
```

(This task has no standalone UI to click through yet — Task 9/10/11 wire it into visible components. It's still independently reviewable: the diff is self-contained and the exported interface is fully specified above.)

---

### Task 9: Shared `CouponBox` component

**Files:**
- Create: `src/components/cart/CouponBox.jsx`

**Interfaces:**
- Consumes: `useCart()` (Task 8), `apiErrorMessage` ([lib/api.js](../../../src/lib/api.js)), `formatINR` ([lib/currency.js](../../../src/lib/currency.js)).
- Produces: `<CouponBox />` — a self-contained input+apply UI when no coupon is applied, or an applied-coupon summary row with a remove button. Consumed by `Cart.jsx` (Task 10) and `Checkout.jsx` (Task 11).

- [ ] **Step 1: Write the component**

```jsx
import { useState, useEffect } from "react"
import { Tag, X } from "lucide-react"
import toast from "react-hot-toast"
import { useCart } from "../../context/CartContext"
import { apiErrorMessage } from "../../lib/api"
import { formatINR } from "../../lib/currency"

export default function CouponBox() {
  const { coupon, applyCoupon, removeCoupon, couponWarning, clearCouponWarning } = useCart()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (couponWarning) {
      toast.error(couponWarning)
      clearCouponWarning()
    }
  }, [couponWarning, clearCouponWarning])

  async function handleApply(e) {
    e.preventDefault()
    if (!code.trim()) return
    setApplying(true)
    setError("")
    try {
      await applyCoupon(code)
      setCode("")
      toast.success("Coupon applied")
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setApplying(false)
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <Tag size={14} /> Coupon {coupon.code} applied — −{formatINR(coupon.discountAmount)}
        </span>
        <button
          type="button"
          onClick={removeCoupon}
          className="text-cloud-400 transition hover:text-cloud-100"
          aria-label="Remove coupon"
        >
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleApply} className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Have a coupon?"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={applying}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-cloud-100 transition hover:bg-white/10 disabled:opacity-60"
        >
          {applying ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cart/CouponBox.jsx
git commit -m "feat: add shared CouponBox component for Cart and Checkout"
```

---

### Task 10: Wire coupon UI into `Cart.jsx`

**Files:**
- Modify: `src/pages/Cart.jsx`

**Interfaces:**
- Consumes: `discountAmount`, `total` from `useCart()` (Task 8), `<CouponBox />` (Task 9).

- [ ] **Step 1: Update the summary block**

Add the import near the top:

```js
import CouponBox from "../components/cart/CouponBox"
```

Change the destructuring at the top of the component:

```js
  const { items, remove, updateQty, subtotal, discountAmount, total } = useCart()
```

Replace the "summary" `<div>` (currently):

```jsx
        {/* summary */}
        <div className="h-fit rounded-2xl border border-white/8 bg-ink-850 p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-cloud-100">Order Summary</h2>
          <div className="flex items-center justify-between text-sm text-cloud-400">
            <span>Subtotal</span>
            <span className="text-cloud-100">{formatINR(subtotal)}</span>
          </div>
          <div className="my-4 border-t border-white/8" />
          <div className="flex items-center justify-between font-display text-base font-bold text-cloud-100">
            <span>Total</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </Link>
        </div>
```

with:

```jsx
        {/* summary */}
        <div className="h-fit rounded-2xl border border-white/8 bg-ink-850 p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-cloud-100">Order Summary</h2>
          <div className="mb-4">
            <CouponBox />
          </div>
          <div className="flex items-center justify-between text-sm text-cloud-400">
            <span>Subtotal</span>
            <span className="text-cloud-100">{formatINR(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm text-emerald-400">
              <span>Discount</span>
              <span>−{formatINR(discountAmount)}</span>
            </div>
          )}
          <div className="my-4 border-t border-white/8" />
          <div className="flex items-center justify-between font-display text-base font-bold text-cloud-100">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </Link>
        </div>
```

- [ ] **Step 2: Manually verify in the browser**

With the `TEST10` coupon (10% off, all products) from Task 4 still active, log in, add a product to the cart, go to `/cart`, type `TEST10` into the coupon box and click Apply. Expected: a green "Coupon TEST10 applied — −₹X" row appears, a Discount line appears above Total, and Total is `Subtotal − X`. Click the × to remove it — expected: the box reverts to the input, Discount row disappears, Total returns to Subtotal.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Cart.jsx
git commit -m "feat: add coupon input and discount display to Cart page"
```

---

### Task 11: Wire coupon UI into `Checkout.jsx`

**Files:**
- Modify: `src/pages/Checkout.jsx`

**Interfaces:**
- Consumes: `discountAmount`, `total`, `coupon` from `useCart()` (Task 8), `<CouponBox />` (Task 9).

- [ ] **Step 1: Update the destructuring and submit payload**

```js
  const { items, subtotal, discountAmount, total, coupon, clear } = useCart()
```

In `handleSubmit`, change the `createOrder.mutateAsync` call from:

```js
      const order = await createOrder.mutateAsync({
        customer: form,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentReference,
      })
```

to:

```js
      const order = await createOrder.mutateAsync({
        customer: form,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentReference,
        couponCode: coupon?.code || "",
      })
```

- [ ] **Step 2: Add the import**

```js
import CouponBox from "../components/cart/CouponBox"
```

- [ ] **Step 3: Update the summary block**

Replace the "summary" `<div>` (currently):

```jsx
        {/* summary */}
        <div className="h-fit space-y-4 rounded-2xl border border-white/8 bg-ink-850 p-6">
          <h2 className="font-display text-lg font-bold text-cloud-100">Order Summary</h2>
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-cloud-400">
                <span className="min-w-0 truncate pr-3">{item.name} × {item.qty}</span>
                <span className="shrink-0 text-cloud-100">{formatINR(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-4">
            <div className="flex items-center justify-between font-display text-base font-bold text-cloud-100">
              <span>Total</span>
              <span>{formatINR(subtotal)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={createOrder.isPending}
            className="w-full rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {createOrder.isPending ? "Submitting…" : "I've Paid — Submit Order"}
          </button>
        </div>
```

with:

```jsx
        {/* summary */}
        <div className="h-fit space-y-4 rounded-2xl border border-white/8 bg-ink-850 p-6">
          <h2 className="font-display text-lg font-bold text-cloud-100">Order Summary</h2>
          <CouponBox />
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-cloud-400">
                <span className="min-w-0 truncate pr-3">{item.name} × {item.qty}</span>
                <span className="shrink-0 text-cloud-100">{formatINR(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-4 space-y-1.5">
            <div className="flex items-center justify-between text-sm text-cloud-400">
              <span>Subtotal</span>
              <span className="text-cloud-100">{formatINR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-400">
                <span>Discount</span>
                <span>−{formatINR(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5 font-display text-base font-bold text-cloud-100">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={createOrder.isPending}
            className="w-full rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {createOrder.isPending ? "Submitting…" : "I've Paid — Submit Order"}
          </button>
        </div>
```

- [ ] **Step 4: Manually verify end-to-end**

Log in, add a product to the cart, apply `TEST10` on the Cart page, click "Proceed to Checkout" — expected: the applied coupon and discounted total carry over to the Checkout summary automatically (this is the localStorage persistence from Task 8). Submit the order. Expected: on the resulting order-tracking page (once Task 12 ships) the total reflects the discount; in the meantime, confirm via the admin Orders list (Task 12) or by checking the network response of the `POST /api/orders` call that `discountAmount` and the reduced `total` are present.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Checkout.jsx
git commit -m "feat: apply coupon discount and send couponCode on Checkout submit"
```

---

### Task 12: Show the discount on order-tracking and admin Orders pages

**Files:**
- Modify: `src/pages/OrderTrack.jsx`
- Modify: `src/admin/pages/orders/OrderList.jsx`

**Interfaces:**
- Consumes: `order.couponCode`, `order.discountAmount` (Task 5, already present in every `Order` API response via `order.toObject()`/Mongoose's default JSON serialization — no controller changes needed for these two pages).

- [ ] **Step 1: Add a discount row to `OrderTrack.jsx`**

Add the import near the top if not already present (it already imports `formatINR`, so no new import is needed here). Replace the block:

```jsx
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 font-display text-base font-bold text-cloud-100">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
```

with:

```jsx
        {order.discountAmount > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-emerald-400">
            <span>Coupon {order.couponCode}</span>
            <span>−{formatINR(order.discountAmount)}</span>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 font-display text-base font-bold text-cloud-100">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
```

- [ ] **Step 2: Add the discount to the admin Orders "Total" column**

In `src/admin/pages/orders/OrderList.jsx`, replace:

```js
    { key: "total", label: "Total", render: (o) => `₹${o.total.toLocaleString("en-IN")}` },
```

with:

```js
    {
      key: "total",
      label: "Total",
      render: (o) => (
        <div>
          <div>₹{o.total.toLocaleString("en-IN")}</div>
          {o.discountAmount > 0 && (
            <div className="text-xs text-emerald-400">
              {o.couponCode} (−₹{o.discountAmount.toLocaleString("en-IN")})
            </div>
          )}
        </div>
      ),
    },
```

- [ ] **Step 3: Manually verify in the browser**

Open the order-tracking page for the discounted order created in Task 11 (`/order/<id>`) — expected: a green "Coupon TEST10" row with the discount amount above the Total line. Open `/admin/orders` as admin — expected: that same order's Total cell shows the coupon code and discount underneath the total.

- [ ] **Step 4: Commit**

```bash
git add src/pages/OrderTrack.jsx src/admin/pages/orders/OrderList.jsx
git commit -m "feat: display applied coupon discount on order-tracking and admin Orders pages"
```

---

### Task 13: Show the discount in the customer delivery invoice email

**Files:**
- Modify: `server/src/templates/emails/customerDelivery.html`
- Modify: `server/src/services/mailService.js`

**Interfaces:**
- Consumes: `order.couponCode`, `order.discountAmount` (Task 5).

- [ ] **Step 1: Add a placeholder to the template**

In `server/src/templates/emails/customerDelivery.html`, replace:

```html
                <p style="margin:16px 0 0;font-size:15px;color:#0f172a;"><strong>Total Paid: ₹{{total}}</strong></p>
```

with:

```html
                {{discountRow}}
                <p style="margin:16px 0 0;font-size:15px;color:#0f172a;"><strong>Total Paid: ₹{{total}}</strong></p>
```

- [ ] **Step 2: Populate the placeholder in `mailService.js`**

In `server/src/services/mailService.js`, inside `sendCustomerDeliveryEmail`, add before the `renderTemplate(...)` call:

```js
    const discountRow = order.discountAmount > 0
      ? `<p style="margin:16px 0 0;font-size:13px;color:#059669;">Coupon ${escapeHtml(order.couponCode)} applied: −₹${formatMoney(order.discountAmount)}</p>`
      : ""
```

Then add `discountRow` to the data object passed to `renderTemplate`:

```js
    const html = await renderTemplate(path.join(TEMPLATES_DIR, "customerDelivery.html"), {
      orderId: String(order._id).slice(-8),
      customerName: escapeHtml(order.customer.name),
      itemsRows,
      discountRow,
      total: formatMoney(order.total),
      createdAt: formatDate(order.createdAt),
    })
```

- [ ] **Step 3: Manually verify**

Run through the full flow: create a discounted order (Task 11's manual test), then in the admin Orders page click "Verify Payment" (or, if auto-send is off, "Send Product" after verifying). If SMTP env vars are configured, check the received email for the "Coupon TEST10 applied: −₹X" line above "Total Paid". If SMTP isn't configured in your local `.env`, instead call `renderTemplate` directly to confirm the substitution: from `rswebsoft/server`, run
`node -e "import('./src/utils/renderTemplate.js').then(({renderTemplate}) => renderTemplate('./src/templates/emails/customerDelivery.html', {orderId:'x',customerName:'x',itemsRows:'',discountRow:'<p>test</p>',total:'100',createdAt:'x'})).then(html => console.log(html.includes('<p>test</p>') ? 'OK' : 'MISSING'))"`
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add server/src/templates/emails/customerDelivery.html server/src/services/mailService.js
git commit -m "feat: show applied coupon discount in the customer delivery invoice email"
```
