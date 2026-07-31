# Coupon System — Design

Date: 2026-07-31

## Problem

There is no discounting mechanism today. `Order.total` is always the full sum of
`(product.salePrice ?? product.price) * qty` across cart items ([orderController.js](../../../server/src/controllers/orderController.js)),
and admin has no way to issue promotional codes. The request is for an admin-managed coupon
system: custom discount codes that apply to either all products or a specific set of products,
which customers redeem at checkout for a discount.

## Goals

1. Admin can create/edit/delete coupons with a custom code, choosing:
   - Discount type: percentage or fixed ₹ amount.
   - Scope: all products, or a specific list of products.
   - Optional rules: expiry date, total usage limit, one-use-per-customer, minimum order value.
   - Active/Inactive status.
2. Customer enters a coupon code on the Cart page and/or Checkout page; on success the discount is
   shown and carried through to order submission.
3. When a coupon is scoped to specific products, the discount applies only to the matching items in
   the cart — unrelated items in the same cart are unaffected and the coupon is still usable.
4. The discount amount actually charged is always recomputed and validated server-side at order
   creation — never trusted from the client — consistent with how item prices are already
   recomputed from the live `Product` record.
5. Coupon usage (global count, per-user use) is only consumed by a successfully created order, not
   by validation/preview calls.

## Non-goals

- No stacking multiple coupons on one order (single `couponCode` per order).
- No automatic/no-code promotions (discount always requires the customer to type a code).
- No coupon auto-generation/bulk-generation tooling — admin types each code manually.
- No per-category or per-brand scoping — scope is "all products" or an explicit product list only.
- No payment gateway integration change — the existing manual UPI + admin-verification flow is
  unaffected; the coupon only changes the `total` an order is created with.

## Design

### 1. Data model

`server/src/models/Coupon.js`:

```js
{
  code: String,            // required, unique, stored uppercase/trimmed
  discountType: String,    // "percentage" | "fixed"
  discountValue: Number,   // required, > 0 (percentage: 1-100)
  appliesTo: String,       // "all" | "products"
  products: [ObjectId],    // ref Product, only used when appliesTo === "products"
  expiresAt: Date | null,
  usageLimit: Number | null,   // total redemptions across all customers
  usedCount: Number,           // default 0, incremented on successful order creation
  perCustomerLimit: Boolean,   // if true, a signed-in user may use this code at most once
  minOrderValue: Number | null,// checked against the matching-items subtotal
  status: String,           // "active" | "inactive"
  timestamps: true
}
```

Per-user usage is tracked without a separate join table: `createOrder` already saves `couponCode`
on the `Order`, so the per-customer check is `Order.exists({ user, couponCode })` (case-normalized).

### 2. Validation & discount calculation (shared logic)

A single function `resolveCoupon(code, cartItems, userId)` in
`server/src/services/couponService.js`, used by both the public "apply" endpoint and order
creation, so the two can never disagree:

1. Look up the coupon by normalized code; must exist and `status === "active"`.
2. `expiresAt` must be null or in the future.
3. `usageLimit` must be null or `usedCount < usageLimit`.
4. If `perCustomerLimit` and a `userId` is present, reject if that user already has an `Order` with
   this `couponCode`.
5. Determine matching cart items: `appliesTo === "all"` → every item; `appliesTo === "products"` →
   items whose `productId` is in `coupon.products`. If nothing matches, reject
   ("Coupon isn't valid for the items in your cart").
6. Compute `matchedSubtotal` from the matching items (`price * qty`, live product prices — see
   §3). If `minOrderValue` is set and `matchedSubtotal < minOrderValue`, reject.
7. Compute `discountAmount`: percentage → `matchedSubtotal * discountValue / 100`; fixed →
   `min(discountValue, matchedSubtotal)` (never discounts below zero or beyond the matched items).
8. Return `{ coupon, discountAmount, matchedProductIds }`.

Errors are thrown as `ApiError(400, <human-readable reason>)` so both call sites can surface the
same message to the customer.

### 3. API

`server/src/routes/couponRoutes.js`, mounted at `/api/coupons`:

- `GET /api/coupons` — admin-only, list all coupons (with `productCount`/usage info for the table).
- `POST /api/coupons` — admin-only, create.
- `PUT /api/coupons/:id` — admin-only, update.
- `DELETE /api/coupons/:id` — admin-only, delete.
- `POST /api/coupons/apply` — public. Body: `{ code, items: [{ productId, qty }] }`. Re-fetches live
  product prices (same pattern as `createOrder`) to compute `matchedSubtotal`, calls
  `resolveCoupon`, and returns `{ discountAmount, matchedProductIds }` on success or a 400 with a
  message on failure. Does **not** increment `usedCount` — that only happens on order creation.

### 4. Order creation changes

`Order` model gains `couponCode: String` (empty string default) and `discountAmount: Number`
(default 0). `createOrder`:

1. Computes `orderItems`/subtotal exactly as today.
2. If `req.body.couponCode` is present, calls `resolveCoupon` again with the *server-computed* cart
   items and `req.user._id`. If it fails, the whole order creation fails with that message (the
   client should have already caught this via `/apply`, so this is a defense against stale/replayed
   requests, not the primary UX path).
3. `total = subtotal - discountAmount`.
4. On successful `Order.create`, increments `coupon.usedCount` by 1 (only reached once creation
   succeeds).
5. `Order.couponCode` / `discountAmount` are stored so tracking, admin order detail, and the
   delivery-invoice email can all display them.

### 5. Admin panel

New nav entry under the existing "Sales" section in [navConfig.js](../../../src/admin/navConfig.js):
`{ to: "/admin/coupons", label: "Coupons", icon: Tag }`.

- `src/admin/pages/coupons/CouponList.jsx` — table modeled on
  [BrandList.jsx](../../../src/admin/pages/brands/BrandList.jsx): Code, Type (% / ₹), Value, Scope
  ("All Products" or "N Products"), Used/Limit, Status badge (Active / Inactive / Expired —
  Expired is derived client-side from `expiresAt`, not a stored status), expiry date, edit/delete.
  "New Coupon" button.
- `src/admin/pages/coupons/CouponForm.jsx` — modeled on
  [ProductForm.jsx](../../../src/admin/pages/products/ProductForm.jsx): code input (auto-uppercased),
  discount type select, discount value input, "Applies to" radio (All Products / Specific Products)
  revealing a searchable product multi-select when "Specific Products" is chosen, expiry date
  picker, usage limit number input, "Limit to one use per customer" checkbox, minimum order value
  input, active/inactive toggle.
- `src/hooks/useCoupons.js` (admin) — react-query hooks (`useCoupons`, `useCreateCoupon`,
  `useUpdateCoupon`, `useDeleteCoupon`), following the existing `useProducts.js`/`useOrders.js`
  pattern.

### 6. Cart & Checkout UI

`CartContext` ([CartContext.jsx](../../../src/context/CartContext.jsx)) gains:
- State: `couponCode`, `discountAmount`, `matchedProductIds` — persisted to the same `rs_cart`
  localStorage blob as `items`, so the applied coupon survives Cart → Checkout navigation and page
  reloads.
- `applyCoupon(code)` — calls `POST /api/coupons/apply` with current `items`; on success stores the
  result, on failure throws (caller shows a toast/inline error) and leaves state unchanged.
- `removeCoupon()` — clears the three fields.
- Re-validation effect: whenever `items` changes while a coupon is applied, silently re-run
  `applyCoupon(couponCode)`; if it now fails, clear the coupon and toast the reason (qty/removal
  can invalidate a min-order-value or product-scoped coupon).
- `clear()` also clears the coupon fields.
- `discountedTotal` derived value: `subtotal - discountAmount`.

UI, added to the existing order-summary boxes in both
[Cart.jsx](../../../src/pages/Cart.jsx) and [Checkout.jsx](../../../src/pages/Checkout.jsx):
- "Have a coupon?" text input + Apply button above the Subtotal/Total block.
- Applied state: green row "Coupon `CODE` applied − ₹X" with a remove (×) button; summary becomes
  Subtotal → Discount → Total.
- Failure: inline red text under the input, input stays editable.

`Checkout.jsx`'s `handleSubmit` sends `couponCode` (not `discountAmount`) in the `createOrder`
payload. The order confirmation / tracking page and the admin Order detail view add a
"Coupon: CODE (−₹X)" line when `order.couponCode` is non-empty; the customer-delivery invoice email
template gets the same line.

## Testing

- Server: unit-style tests (or manual API calls) for `resolveCoupon` covering each rejection reason
  (expired, inactive, usage limit hit, per-customer limit hit, no matching products, below minimum
  order value) and both discount types, including the fixed-discount clamp when
  `discountValue > matchedSubtotal`.
- `createOrder`: verify `usedCount` increments only on success, and that a stale/invalid
  `couponCode` at order-creation time is rejected even if `/apply` was never called (simulating a
  replayed/edited request).
- Manual: create an all-products % coupon and a specific-product fixed coupon in admin, apply both
  from Cart and Checkout, confirm partial-cart matching, expiry, and usage-limit behavior in the UI.
