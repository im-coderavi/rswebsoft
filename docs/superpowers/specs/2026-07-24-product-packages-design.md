# Product Packages (Buy Source Code / Installation) — Design Spec

Date: 2026-07-24

## Problem

Every product currently has a single price and a single Buy Now / Add to Cart flow. The store owner wants to additionally show, per product, a small set of named "packages" (e.g. "Buy Source Code" at the base price, "Installation" at a higher price for a done-for-you setup) as an informational display on the product page — configurable per-product from the admin panel, with a one-time bulk setup so all 226 existing products get sensible defaults immediately.

## Scope

- Packages are **informational only** — they do not change the existing Buy Now / Add to Cart / cart / checkout flow, which stays exactly as it is today.
- Admin can add/edit/remove/reorder packages per product (not limited to exactly 2 — the two named ones are just the initial bulk defaults).
- A one-time migration script bulk-applies "Buy Source Code" (= current price) and "Installation" (= current price + ₹499) to every product that doesn't already have packages set.

## Data Model

Add to `server/src/models/Product.js`:

```js
packages: [
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
  },
],
```
Each package subdocument keeps Mongoose's default auto-generated `_id` (unlike `imageSchema`, which opts out via `{ _id: false }` because images are keyed by `publicId` instead) — packages have no natural key, and the `_id` isn't referenced anywhere, so the default is harmless.

Default: `[]` — no impact on any existing product until either the migration script or an admin edit sets it.

## Admin (`ProductForm.jsx`)

New "Packages" section, placed directly below the existing "Features" section, using the same interaction shape (add row / remove / reorder) as the Task-plan-proven Features chip editor, but each row carries two fields instead of one:

- Name text input (required to add)
- Price number input (required to add, must be a valid non-negative number)
- Optional Description text input

Add button appends `{ name, price: Number(price), description }` to `form.packages` (a plain array in form state, mirroring `form.features`). Each existing row shows Name — ₹Price — Description (if any), with ▲▼ reorder and ✕ remove, same as Features.

## Bulk Migration Script

`server/scripts/seedProductPackages.js` (idempotent, follows the exact `seedHomeSections.js` pattern: `connectDB()`, loop, skip-if-already-set, log per-product):

```
For each Product where packages is empty/missing:
  packages = [
    { name: "Buy Source Code", price: product.price },
    { name: "Installation", price: product.price + 499 },
  ]
  save
```

Run once via `npm run seed-packages` (new script entry in `server/package.json`, mirroring `seed-sections`).

## Product Page (`ProductDetail.jsx`)

New card section (visible only when `product.packages?.length > 0`, same guard pattern as the existing Features card), placed after the "Key Features Included" card in the left column. Each package renders as a simple bordered row/card: name, price (formatted via `formatINR`), and description below if present. No button, no click handler, no cart interaction — purely informational, consistent with the approved design.

## Edge Cases

- Product with no packages: section doesn't render at all (matches Features' existing empty-guard behavior).
- Re-running the migration script: products that already have `packages.length > 0` are skipped and logged as such (same convention as `seedHomeSections.js`'s "Skipping ... — already exists" log line).
- Admin removes all packages via the form: next save persists an empty array, section stops rendering on the product page — no special-case handling needed.

## Out of Scope

- No change to Buy Now / Add to Cart / `CartContext` / checkout / `Order` model — packages are never added to the cart.
- No admin bulk-apply UI button — the one-time script is the only bulk mechanism per the approved design (future re-runs for newly added products are still possible by re-running the same idempotent script).
