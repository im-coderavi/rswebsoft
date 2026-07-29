# Order Email Notifications, Payment Verification & Product Delivery — Design

Date: 2026-07-29

## Problem

Orders currently flow through `Order.status` (`pending → paid → fulfilled / cancelled`) with no
notifications and no formal delivery step:

- Admin has no way of knowing a new order/payment arrived except manually checking the Orders list.
- When admin approves a payment, the customer gets no email — they must self-serve via the public
  order-tracking page to see `product.downloadUrl`, and only once status is `fulfilled`.
- The Orders admin list doesn't show which specific products were bought per order (`items.product`
  isn't populated), making manual review harder.
- There's no invoice document/email at all.
- Some product "live preview" links open in the same tab instead of a new tab.

## Goals

1. SMTP email sending via Gmail (nodemailer), configured through env vars.
2. Admin gets an email the moment an order is placed, containing order/customer/product/payment-reference
   details, so they know a payment needs verification.
3. Admin can mark payment as verified ("paid"). At that point, based on a global Auto-send setting:
   - **Auto-send ON**: the system immediately emails the customer an HTML invoice + product
     download link(s), and marks the order `fulfilled`.
   - **Auto-send OFF**: the order sits in `paid` state with a "Send Product" button in the admin
     panel; clicking it sends the same customer email and marks the order `fulfilled`.
4. Admin Orders page shows the actual products (name + download link) per order, not just a count.
5. All "live preview" triggers open the target in a new browser tab, including the two fallback
   cases that currently navigate in-app.

## Non-goals

- No payment gateway integration (UPI manual-reference flow stays as-is).
- No PDF generation — the invoice is an HTML email, not an attached PDF file.
- No separate `Payment` model — `Order.status` continues to be the source of truth.
- No customer-facing "order placed" confirmation email (not requested) — only the two emails
  described above (admin-new-order, customer-delivery-invoice).
- No retry/queue infrastructure for email sending — failures are logged; sending is fire-and-forget
  relative to the HTTP response (the triggering admin action still succeeds even if the email fails,
  but the failure is surfaced in the API response so the admin can retry via "Send Product").

## Design

### 1. Mail service

- `server/src/config/mail.js` — nodemailer transporter, Gmail SMTP, built from env vars:
  `SMTP_HOST` (default `smtp.gmail.com`), `SMTP_PORT` (default `465`), `SMTP_SECURE` (default `true`),
  `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (defaults to `SMTP_USER`), `ADMIN_NOTIFY_EMAIL` (defaults to
  existing `ADMIN_EMAIL`).
- `server/src/services/mailService.js` — exports `sendAdminNewOrderEmail(order)` and
  `sendCustomerDeliveryEmail(order)`. Each: loads its HTML template, interpolates data, calls
  `transporter.sendMail`. Both wrap send calls in try/catch and return `{ ok, error }` rather than
  throwing, so callers can decide how to react (log vs. surface to admin).
- `server/src/templates/emails/adminNewOrder.html` and `customerDelivery.html` — simple inline-styled
  HTML (email-client-safe: tables/inline CSS, no external assets) with `{{placeholders}}` replaced by
  a small template-interpolation helper (`utils/renderTemplate.js`, simple `{{key}}` string replace —
  no new templating dependency).
- `customerDelivery.html` renders an invoice block: order id, date, itemized product/price rows,
  total, and a download link (or list of links, one per item) per purchased product.
- `.env.example` gets the new SMTP_* / ADMIN_NOTIFY_EMAIL keys documented (no real secrets committed).
  The real Gmail address + app password the user provided go into the actual (git-ignored) `server/.env`.

### 2. Order status / settings changes

- Reuse existing `Order.status` enum as-is (`pending, paid, fulfilled, cancelled`) — no schema change
  needed for the state machine itself.
- Add `orderNotified: Boolean` (default false) and `productSentAt: Date` (nullable) fields to `Order`
  to avoid double-sending emails on repeated status-update calls.
- Extend `PaymentSetting` (the existing singleton settings doc) with `autoSendOnVerify: Boolean`
  (default `false`). Admin settings page gets a toggle bound to this field via the existing
  `paymentSettingController`/hook.
- `orderController.js`:
  - `createOrder`: after successful save, call `sendAdminNewOrderEmail(order)` (fire-and-forget,
    log failure) and set `orderNotified = true`.
  - New `verifyPayment` (admin, `PUT /api/orders/:id/verify-payment`): guards `status === "pending"`,
    sets `status = "paid"`. If `PaymentSetting.autoSendOnVerify` is true, immediately performs the
    same steps as `sendProduct` below (email + `fulfilled`) before responding.
  - New `sendProduct` (admin, `POST /api/orders/:id/send-product`): guards `status === "paid"`,
    calls `sendCustomerDeliveryEmail(order)`, and on success sets `status = "fulfilled"`,
    `productSentAt = now`. Populates `items.product` first so the email/invoice has product names
    and `downloadUrl`. If mail send fails, responds with an error and leaves status as `paid` so
    admin can retry.
  - `listOrders`: add `.populate("items.product", "name slug downloadUrl")` so the admin list can
    show real product names/links without an extra request per row.
  - `updateOrderStatus` (existing generic endpoint) stays for `cancelled` and manual overrides, but
    the admin UI will route the paid/fulfilled transitions through the two new dedicated endpoints
    instead of the raw dropdown, since those are the ones with side effects (emails).

### 3. Admin panel UI (`src/admin/pages/orders/OrderList.jsx`)

- Row expands to show product name(s) (with `downloadUrl` visible to admin) instead of just an item
  count.
- Status column keeps the existing dropdown for `cancelled`/manual correction, but adds explicit
  buttons:
  - **"Verify Payment"** — visible when `status === "pending"`; calls new `useVerifyOrderPayment`
    mutation → `PUT /api/orders/:id/verify-payment`.
  - **"Send Product"** — visible when `status === "paid"`; calls new `useSendOrderProduct` mutation
    → `POST /api/orders/:id/send-product`. Disabled/hidden once `fulfilled` (shows "Sent" badge with
    `productSentAt` timestamp instead).
- A small **Auto-send toggle** added to the existing payment-settings admin screen (wherever
  `PaymentSetting` is currently edited), bound to `autoSendOnVerify`.
- `src/hooks/useOrders.js` gets the two new mutation hooks, invalidating the orders query on success.

### 4. Live preview → new tab

- `src/components/home/ProductCard.jsx` (`handlePreviewClick` fallback) and
  `src/components/home/DeliveredWebsiteCard.jsx` (internal-navigate fallback): when there's no
  external `demoUrl`, currently `navigate(...)` in-app. Change both to `window.open(path, "_blank",
  "noopener,noreferrer")` so every preview trigger opens a new tab, consistent with the
  already-correct external-`demoUrl` cases elsewhere in the app.
- `src/pages/ProductDetail.jsx`'s modal-based "Live Preview" button stays a modal (there's no
  separate URL to open in a new tab there — the modal *is* the preview), left unchanged.

## Testing

- Unit-ish: mailService functions tested by mocking the nodemailer transporter (verify template
  interpolation produces expected recipient/subject/body content, and that send failures return
  `{ ok: false }` instead of throwing).
- Manual verification: place a test order → confirm admin email arrives; verify payment with
  auto-send off → confirm no customer email yet, "Send Product" button appears; click it → confirm
  customer email arrives with correct invoice totals and working download link; toggle auto-send on
  → verify a new order's payment verification alone triggers the customer email without a manual
  click.
- Manual verification of preview links: click preview on a product without `demoUrl` from the
  homepage — confirm it opens in a new tab.
