# Purchasable Product Packages — Design Spec

Date: 2026-07-24

## Problem

The just-shipped "Available Packages" section on the product page is informational only — it shows name/price/description but has no purchase action, and the underlying `packages` subdocuments have no feature bullet list. The store owner wants each package to be independently buyable (its own Buy Now / Add to Cart, its own price flowing into the order), to show its own bullet-point feature list (admin-editable), and wants all 226 products backfilled with reasonable demo feature bullets on their two existing default packages.

## Scope Change From Prior Spec

The prior spec (`2026-07-24-product-packages-design.md`) explicitly said packages "do not change the existing Buy Now / Add to Cart / cart / checkout flow." This spec **supersedes that constraint**: packages are now independently purchasable, in addition to (not replacing) the existing base-product Buy Box, which is unchanged.

## Data Model

Extend the package subdocument in `server/src/models/Product.js` (added in the prior spec) with a `features` array:

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

## Cart Identity

Today, `CartContext` keys cart items purely by `productId` — one line per product. Since a package purchase is a differently-priced variant of the same product, cart lines must be keyed by `productId` + an optional `packageId` (the package subdocument's auto-generated `_id`):

- Buying the base product (no package selected): `packageId` is `undefined` — behavior identical to today.
- Buying a package: cart item carries `packageId` (the package's `_id`) and `packageName`, and its `price` is the package's price, not the base product's.
- `CartContext.add`/`remove`/`updateQty` match on `(productId, packageId)` instead of `productId` alone, so the base product and each package variant are independent lines — a customer can have "Product X", "Product X — Buy Source Code", and "Product X — Installation" all in the cart simultaneously.

## Cart / Checkout Display

Both `Cart.jsx` and `Checkout.jsx` render `item.name` today; when `item.packageName` is present, display it as `"{name} — {packageName}"` so the two lines for the same product are visually distinguishable. `key={item.productId}` becomes `key={`${item.productId}:${item.packageId || "base"}`}` (React list key only — no behavior change beyond disambiguating package lines).

## Backend Price Integrity (required fix, not optional)

`orderController.createOrder` currently always recomputes each order line's price as `product.salePrice ?? product.price`, ignoring whatever the client sent — correct today (single price), but it would silently downgrade a package purchase back to the base price if left unchanged. Fix: each incoming cart item optionally carries `packageId`; when present, the server looks up that package on the live product record (`product.packages.id(packageId)`) and uses **its** price and name for the order line instead of the base product's. If the referenced package no longer exists on the product (deleted since being added to cart), reject that item the same way an unavailable product is already rejected today (400 "One or more items are no longer available").

`Order.items` subdocument gains an optional `packageName` field (string, for display on the order/track pages) — no new `packageId` reference needed there since the order is a point-in-time snapshot (name + price already captured).

## Product Page

Each package card (in the existing "Available Packages" section) gains:
- Its feature list rendered as a compact bullet checklist (same visual language as the product-level "Key Features Included" card, scaled down to fit inside the package card) — only shown when the package has at least one feature.
- A **Buy Now** button (adds this package variant to cart, navigates to `/checkout`) and an **Add to Cart** button (adds without navigating) — mirroring the main Buy Box's two-button pattern for consistency, sized appropriately for the smaller card.

The existing top Buy Box (base product Buy Now / Add to Cart / Live Preview) is unchanged.

## Admin (`ProductForm.jsx`)

Redesign the Packages section from "flat add-only list" to a list of **editable package blocks**, since each package now needs its own feature sub-list:

- "+ Add Package" appends a new blank block `{ name: "", price: 0, description: "", features: [] }` to `form.packages`.
- Each block renders Name / Price / Description as directly-editable inputs bound to that array index (not a separate staging input — matches how, e.g., `TONE_KEYS` selection or image list editing already binds directly to array state elsewhere in the admin).
- Each block has its own mini feature-chip editor (add input + Add button + removable/reorderable chips) — same interaction as the product-level Features editor, scoped to `form.packages[i].features`.
- Whole blocks can be reordered (▲▼) and removed (✕), same as before.

## Bulk Demo Data

New migration script `server/scripts/seedProductPackageFeatures.js` (idempotent): for every product, for every package named exactly `"Buy Source Code"` or `"Installation"` whose `features` array is empty, set:

- `"Buy Source Code"` → `["Full source code files", "Free lifetime updates", "Documentation included", "Email support for setup queries"]`
- `"Installation"` → `["Everything in Buy Source Code", "Professional installation on your hosting server", "Domain & server configuration", "1-on-1 setup call with our team", "7-day post-installation support"]`

Packages with any other name (e.g. a custom "Priority Support" package an admin already created) are left untouched — admin-authored content is never overwritten.

## Edge Cases

- Package with no features: card renders without a bullet list (no empty box), same guard pattern as the product-level Features card.
- Cart item referencing a package that gets deleted from the product afterward: checkout-time validation rejects it with the existing "no longer available" error (no crash, no silent wrong price).
- Admin removes a package that's currently sitting in some customer's local cart (never checked out): same rejection path applies at checkout time — no cleanup job needed, matches how a deleted product already behaves today.

## Out of Scope

- No wishlist/comparison features for packages.
- No per-package images — packages continue to reuse the parent product's images/gallery.
- No change to `Order` admin list/detail UI beyond showing `packageName` where present (uses existing generic order-item rendering).
