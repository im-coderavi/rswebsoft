# Package "Buy on WhatsApp" — Design Spec (amends purchasable-packages spec)

Date: 2026-07-24

## Change of Direction

The just-implemented cart/checkout support for buying a package directly (Tasks 3–5 of `2026-07-24-purchasable-product-packages.md`) is replaced before shipping: instead of Buy Now/Add to Cart per package, each package gets a single **"Buy on WhatsApp"** button that opens a pre-filled WhatsApp chat with the store's number. The base product's existing Buy Now/Add to Cart/cart/checkout flow is completely unaffected — it never used package context in the first place.

## Revert

Undo, back to their pre-session state:
- `src/context/CartContext.jsx` — `add`/`remove`/`updateQty` keyed by `productId` only again.
- `src/pages/Cart.jsx` / `src/pages/Checkout.jsx` — no package-name display, no `packageId` in the checkout payload.
- `server/src/controllers/orderController.js` — no package price/name lookup branch.
- `src/pages/ProductDetail.jsx` — `cartItem()`/`handleAddToCart()`/`handleBuyNow()` return to their no-argument form (used only by the top Buy Box).

## New: WhatsApp Number Setting

`server/src/models/PaymentSetting.js` gains `whatsappNumber: { type: String, default: "" }`. Same singleton document pattern as `upiId` — one global number for the whole store. Admin sets it on the existing Settings page (`src/admin/pages/Settings.jsx`), alongside the UPI fields.

## Product Page — Package Card Buy Button

Each package card keeps its name/price/description/feature-bullet display (unchanged from the just-shipped work) but its action row becomes a single full-width button:

**"Buy on WhatsApp"** (lucide `MessageCircle` icon) → opens `https://wa.me/{digits-only number}?text={encoded message}` in a new tab, where the message is:
```
Hi! I'm interested in buying "{package name}" for "{product name}" (₹{package price}).
{current page URL}
```
If the store hasn't set a WhatsApp number yet, the button is hidden (not rendered) rather than opening a broken link — matches the existing pattern where Payment Settings' UPI section already tolerates being unset (`Checkout.jsx` already handles `!hasQr && !hasUpi`).

## Out of Scope

- No WhatsApp Business API integration — this is the standard `wa.me` deep link, same mechanism as the existing homepage/footer might already use for support contact (not currently present, but this is the standard low-effort approach for a UPI-manual-verification store like this one).
- No per-package WhatsApp number — one global number, per the approved design.
