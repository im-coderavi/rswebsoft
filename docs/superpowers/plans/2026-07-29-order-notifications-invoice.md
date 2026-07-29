# Order Email Notifications, Payment Verification & Product Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send an HTML admin email on every new order, let admins verify payment and deliver products (manually or automatically) with an HTML invoice email to the customer, show real product info in the admin Orders list, and make every product "live preview" trigger open in a new tab.

**Architecture:** A new `server/src/services/mailService.js` wraps a single nodemailer transporter (Gmail SMTP) and exposes two send functions, each backed by an HTML template file with `{{placeholder}}` interpolation. `orderController.js` gains two new admin actions (`verifyPayment`, `sendProduct`) that sit between the existing `pending → paid → fulfilled` states and call the mail service; a new `autoSendOnVerify` flag on the existing `PaymentSetting` singleton decides whether `verifyPayment` auto-chains into `sendProduct`. The admin Orders UI gets buttons for these two actions plus per-item product visibility (via populate). Two React components get their internal-fallback preview links switched from `navigate()` to `window.open(..., "_blank")`.

**Tech Stack:** Node/Express/Mongoose (ESM) backend, nodemailer for SMTP, React + React Query + axios frontend. No new frontend dependencies.

## Global Constraints

- Backend is ESM (`"type": "module"` in `server/package.json`) — use `import`/`export`, `.js` extensions in relative imports, matching every existing file in `server/src`.
- No test framework exists in this repo today (no `jest`/`vitest`/`mocha` in either `package.json`). Do not introduce one for this feature — verify each backend task with small one-off `node` scripts run via the `node -e` / temp-script pattern shown in each task, and verify frontend tasks by running the dev servers and clicking through. Delete any temp verification scripts after use; they are not part of the deliverable.
- Real SMTP credentials (Gmail `avishekgiri31@gmail.com` + app password) go only into `server/.env` (already git-ignored — confirmed via `.gitignore`'s `.env` / `.env.*` rules). Never put real credentials in `server/.env.example` or in committed code.
- Follow existing code conventions exactly: controllers wrapped in `asyncHandler`, errors thrown as `new ApiError(status, message)`, routes protected with `protect, adminOnly` from `server/src/middleware/auth.js`, React Query hooks in `src/hooks/*.js` calling the shared `api` axios instance from `src/lib/api.js`, admin UI styled with the existing Tailwind ink/cloud/brand color tokens already used in `OrderList.jsx`/`Settings.jsx`.
- `Order.total` and product prices are in INR (see `formatINR` usage elsewhere) — email templates must format money as `₹` with `.toLocaleString("en-IN")`, not `$` (note: `OrderList.jsx` currently renders `$` — leave that pre-existing display bug alone, out of scope for this plan).

---

### Task 1: Install nodemailer, add SMTP env vars, create mail transporter config

**Files:**
- Modify: `server/package.json` (add `nodemailer` dependency)
- Modify: `server/.env.example` (document new keys, no secrets)
- Modify: `server/.env` (real Gmail credentials — git-ignored, not committed)
- Create: `server/src/config/mail.js`

**Interfaces:**
- Produces: `server/src/config/mail.js` exports `default transporter` (a configured `nodemailer.Transporter`) and named `mailFrom` (string) and `adminNotifyEmail` (string), for `mailService.js` (Task 3) to consume.

- [ ] **Step 1: Install nodemailer**

Run: `cd server && npm install nodemailer`

Expected: `nodemailer` appears in `server/package.json` `dependencies` and `server/node_modules/nodemailer` exists.

- [ ] **Step 2: Add SMTP keys to `server/.env.example`**

Append to the end of `server/.env.example`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ADMIN_NOTIFY_EMAIL=
```

- [ ] **Step 3: Add real SMTP keys to `server/.env`**

Append to the end of `server/.env` (this file is git-ignored, confirmed in Global Constraints). Use the real Gmail address and app password provided out-of-band (never write real credentials into this plan document or any other committed file):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<redacted — see server/.env>
SMTP_PASS=<redacted — see server/.env>
SMTP_FROM=<redacted — see server/.env>
ADMIN_NOTIFY_EMAIL=<redacted — see server/.env>
```

Note: Gmail app passwords are shown by Google with spaces for readability but must be stored without spaces when pasted into `.env`.

- [ ] **Step 4: Create the transporter config**

Create `server/src/config/mail.js`:

```js
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const mailFrom = process.env.SMTP_FROM || process.env.SMTP_USER
export const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL

export default transporter
```

- [ ] **Step 5: Verify the transporter can authenticate**

Create a throwaway file `server/verify-smtp.mjs`:

```js
import "dotenv/config"
import transporter from "./src/config/mail.js"

transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP verify failed:", err.message)
    process.exit(1)
  }
  console.log("SMTP verify OK:", success)
  process.exit(0)
})
```

Run: `cd server && node verify-smtp.mjs`
Expected: `SMTP verify OK: true`. If it fails with an auth error, the Gmail app password in `server/.env` needs re-checking (spaces removed, 2FA enabled on the Google account).

Delete `server/verify-smtp.mjs` after this passes (per Global Constraints — temp scripts aren't part of the deliverable).

- [ ] **Step 6: Commit**

```bash
git add server/package.json server/package-lock.json server/.env.example server/src/config/mail.js
git commit -m "Add nodemailer SMTP transporter config"
```

(`server/.env` is git-ignored and won't be staged — verify with `git status` that it doesn't appear.)

---

### Task 2: HTML email templates + interpolation helper

**Files:**
- Create: `server/src/utils/renderTemplate.js`
- Create: `server/src/templates/emails/adminNewOrder.html`
- Create: `server/src/templates/emails/customerDelivery.html`

**Interfaces:**
- Produces: `renderTemplate(templatePath, data)` — async function, reads the HTML file at `templatePath`, replaces every `{{key}}` occurrence with `data[key]` (empty string if missing), returns the resulting HTML string. Consumed by `mailService.js` (Task 3).
- `adminNewOrder.html` placeholders: `{{orderId}}`, `{{customerName}}`, `{{customerEmail}}`, `{{customerPhone}}`, `{{itemsRows}}` (pre-built `<tr>` HTML string), `{{total}}`, `{{paymentReference}}`, `{{createdAt}}`.
- `customerDelivery.html` placeholders: `{{orderId}}`, `{{customerName}}`, `{{itemsRows}}` (pre-built `<tr>` HTML string, each row includes a download link per item), `{{total}}`, `{{createdAt}}`.

- [ ] **Step 1: Write the interpolation helper**

Create `server/src/utils/renderTemplate.js`:

```js
import { readFile } from "fs/promises"

// Replaces every {{key}} in the template file with data[key] (or "" if missing).
export async function renderTemplate(templatePath, data) {
  const raw = await readFile(templatePath, "utf-8")
  return raw.replace(/{{\s*(\w+)\s*}}/g, (_, key) => (data[key] != null ? String(data[key]) : ""))
}
```

- [ ] **Step 2: Create the admin new-order template**

Create `server/src/templates/emails/adminNewOrder.html`:

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#0f172a;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">New Order — Payment Verification Needed</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 12px;color:#334155;font-size:14px;">Order <strong>#{{orderId}}</strong> was placed on {{createdAt}}.</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;color:#334155;">
                  <tr><td style="padding:4px 0;width:140px;color:#64748b;">Customer</td><td style="padding:4px 0;">{{customerName}}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b;">Email</td><td style="padding:4px 0;">{{customerEmail}}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b;">Phone</td><td style="padding:4px 0;">{{customerPhone}}</td></tr>
                  <tr><td style="padding:4px 0;color:#64748b;">Payment Reference</td><td style="padding:4px 0;">{{paymentReference}}</td></tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:#f1f5f9;">
                      <th align="left" style="padding:8px;border:1px solid #e2e8f0;">Product</th>
                      <th align="right" style="padding:8px;border:1px solid #e2e8f0;">Qty</th>
                      <th align="right" style="padding:8px;border:1px solid #e2e8f0;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{itemsRows}}
                  </tbody>
                </table>

                <p style="margin:16px 0 0;font-size:15px;color:#0f172a;"><strong>Total: ₹{{total}}</strong></p>

                <p style="margin:20px 0 0;font-size:13px;color:#64748b;">Log in to the admin panel → Orders to verify this payment and deliver the product.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

- [ ] **Step 3: Create the customer delivery/invoice template**

Create `server/src/templates/emails/customerDelivery.html`:

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#059669;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Your Order Is Ready</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 4px;color:#334155;font-size:14px;">Hi {{customerName}},</p>
                <p style="margin:0 0 16px;color:#334155;font-size:14px;">Your payment has been verified and your product is ready. Invoice details below.</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:13px;color:#64748b;">
                  <tr><td>Invoice #{{orderId}}</td><td align="right">{{createdAt}}</td></tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:#f1f5f9;">
                      <th align="left" style="padding:8px;border:1px solid #e2e8f0;">Product</th>
                      <th align="right" style="padding:8px;border:1px solid #e2e8f0;">Qty</th>
                      <th align="right" style="padding:8px;border:1px solid #e2e8f0;">Price</th>
                      <th align="left" style="padding:8px;border:1px solid #e2e8f0;">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {{itemsRows}}
                  </tbody>
                </table>

                <p style="margin:16px 0 0;font-size:15px;color:#0f172a;"><strong>Total Paid: ₹{{total}}</strong></p>

                <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">Keep this email as your invoice/receipt. If a download link doesn't work, reply to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

- [ ] **Step 4: Verify template rendering**

Create a throwaway file `server/verify-template.mjs`:

```js
import { renderTemplate } from "./src/utils/renderTemplate.js"

const html = await renderTemplate("./src/templates/emails/adminNewOrder.html", {
  orderId: "abc123",
  customerName: "Test User",
  customerEmail: "test@example.com",
  customerPhone: "9999999999",
  itemsRows: "<tr><td>Sample Product</td><td align='right'>1</td><td align='right'>999</td></tr>",
  total: "999",
  paymentReference: "UPI123",
  createdAt: new Date().toLocaleDateString("en-IN"),
})

console.log(html.includes("Test User") && html.includes("Sample Product") ? "PASS" : "FAIL")
```

Run: `cd server && node verify-template.mjs`
Expected: `PASS`

Delete `server/verify-template.mjs` after this passes.

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/renderTemplate.js server/src/templates/emails
git commit -m "Add HTML email templates and interpolation helper"
```

---

### Task 3: Mail service (send functions)

**Files:**
- Create: `server/src/services/mailService.js`

**Interfaces:**
- Consumes: `transporter, mailFrom, adminNotifyEmail` from `server/src/config/mail.js` (Task 1); `renderTemplate` from `server/src/utils/renderTemplate.js` (Task 2).
- Produces:
  - `async function sendAdminNewOrderEmail(order)` → `Promise<{ ok: boolean, error?: string }>`. `order` must have `_id, customer{name,email,phone}, items[{name,price,qty}], total, paymentReference, createdAt`.
  - `async function sendCustomerDeliveryEmail(order)` → `Promise<{ ok: boolean, error?: string }>`. `order` must have `_id, customer{name,email}, items[{name,price,qty,product}], total, createdAt` where `items[].product` is a populated `{ downloadUrl }` (or `{ _id, downloadUrl }`) object.
  - Both consumed by `orderController.js` (Task 5).

- [ ] **Step 1: Write the mail service**

Create `server/src/services/mailService.js`:

```js
import path from "path"
import { fileURLToPath } from "url"
import transporter, { mailFrom, adminNotifyEmail } from "../config/mail.js"
import { renderTemplate } from "../utils/renderTemplate.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = path.join(__dirname, "..", "templates", "emails")

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-IN")
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
}

export async function sendAdminNewOrderEmail(order) {
  try {
    const itemsRows = order.items
      .map(
        (item) =>
          `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${item.name}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">${item.qty}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">₹${formatMoney(item.price)}</td></tr>`
      )
      .join("")

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "adminNewOrder.html"), {
      orderId: String(order._id).slice(-8),
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      itemsRows,
      total: formatMoney(order.total),
      paymentReference: order.paymentReference || "—",
      createdAt: formatDate(order.createdAt),
    })

    await transporter.sendMail({
      from: mailFrom,
      to: adminNotifyEmail,
      subject: `New Order #${String(order._id).slice(-8)} — Payment Verification Needed`,
      html,
    })

    return { ok: true }
  } catch (err) {
    console.error("sendAdminNewOrderEmail failed:", err.message)
    return { ok: false, error: err.message }
  }
}

export async function sendCustomerDeliveryEmail(order) {
  try {
    const itemsRows = order.items
      .map((item) => {
        const downloadUrl = item.product?.downloadUrl || ""
        const link = downloadUrl
          ? `<a href="${downloadUrl}" style="color:#059669;">Download</a>`
          : "—"
        return `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${item.name}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">${item.qty}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">₹${formatMoney(item.price)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${link}</td></tr>`
      })
      .join("")

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "customerDelivery.html"), {
      orderId: String(order._id).slice(-8),
      customerName: order.customer.name,
      itemsRows,
      total: formatMoney(order.total),
      createdAt: formatDate(order.createdAt),
    })

    await transporter.sendMail({
      from: mailFrom,
      to: order.customer.email,
      subject: `Your Order #${String(order._id).slice(-8)} — Invoice & Download`,
      html,
    })

    return { ok: true }
  } catch (err) {
    console.error("sendCustomerDeliveryEmail failed:", err.message)
    return { ok: false, error: err.message }
  }
}
```

- [ ] **Step 2: Verify against the real inbox**

Create a throwaway file `server/verify-mail.mjs`:

```js
import "dotenv/config"
import { sendAdminNewOrderEmail, sendCustomerDeliveryEmail } from "./src/services/mailService.js"

const fakeOrder = {
  _id: "665f1a2b3c4d5e6f7a8b9c0d",
  customer: { name: "Test Customer", email: process.env.SMTP_USER, phone: "9999999999" },
  items: [{ name: "Demo Product", price: 999, qty: 1, product: { downloadUrl: "https://example.com/download" } }],
  total: 999,
  paymentReference: "UPI-TEST-123",
  createdAt: new Date(),
}

const r1 = await sendAdminNewOrderEmail(fakeOrder)
const r2 = await sendCustomerDeliveryEmail(fakeOrder)
console.log("admin email:", r1)
console.log("customer email:", r2)
```

Run: `cd server && node verify-mail.mjs`
Expected: both print `{ ok: true }`, and two emails arrive in the `SMTP_USER` inbox (since the fake order emails to itself). Check the inbox visually to confirm formatting looks right.

Delete `server/verify-mail.mjs` after this passes.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/mailService.js
git commit -m "Add mail service for admin/customer order emails"
```

---

### Task 4: Schema changes — Order tracking fields + PaymentSetting auto-send flag

**Files:**
- Modify: `server/src/models/Order.js`
- Modify: `server/src/models/PaymentSetting.js`

**Interfaces:**
- Produces: `Order` documents now have `orderNotified: Boolean` (default `false`) and `productSentAt: Date | null` (default `null`), consumed by `orderController.js` (Task 5) to avoid double-sends.
- Produces: `PaymentSetting` documents now have `autoSendOnVerify: Boolean` (default `false`), consumed by `orderController.js` (Task 5) and the admin Settings page (Task 8).

- [ ] **Step 1: Add fields to `Order.js`**

In `server/src/models/Order.js`, modify the schema (add after `status`):

```js
    status: {
      type: String,
      enum: ["pending", "paid", "fulfilled", "cancelled"],
      default: "pending",
    },
    orderNotified: { type: Boolean, default: false },
    productSentAt: { type: Date, default: null },
```

- [ ] **Step 2: Add field to `PaymentSetting.js`**

In `server/src/models/PaymentSetting.js`, modify the schema (add after `note`):

```js
    note: { type: String, default: "" },
    autoSendOnVerify: { type: Boolean, default: false },
```

- [ ] **Step 3: Verify the schema loads without error**

Run: `cd server && node -e "import('./src/models/Order.js').then(() => import('./src/models/PaymentSetting.js')).then(() => console.log('PASS')).catch((e) => { console.error(e); process.exit(1) })"`

Expected: `PASS` (models compile without throwing — this catches typos/syntax errors; it doesn't need a live DB connection since `mongoose.model()` only registers the schema).

- [ ] **Step 4: Commit**

```bash
git add server/src/models/Order.js server/src/models/PaymentSetting.js
git commit -m "Add order-notification tracking fields and auto-send setting"
```

---

### Task 5: Order controller — trigger admin email on create, add verifyPayment/sendProduct actions, populate items.product

**Files:**
- Modify: `server/src/controllers/orderController.js`

**Interfaces:**
- Consumes: `sendAdminNewOrderEmail, sendCustomerDeliveryEmail` from `server/src/services/mailService.js` (Task 3); `Order.orderNotified/productSentAt` and `PaymentSetting.autoSendOnVerify` fields (Task 4).
- Produces: `verifyPayment(req, res)` and `sendProduct(req, res)` exported controller functions, consumed by `orderRoutes.js` (Task 6). `listOrders` now returns `items.product` populated with `name, slug, downloadUrl`.

- [ ] **Step 1: Update imports and `listOrders`**

In `server/src/controllers/orderController.js`, replace the top import block and `listOrders`:

```js
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import PaymentSetting from "../models/PaymentSetting.js"
import { sendAdminNewOrderEmail, sendCustomerDeliveryEmail } from "../services/mailService.js"

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("items.product", "name slug downloadUrl")
  res.json(orders)
})
```

- [ ] **Step 2: Fire the admin email from `createOrder`**

In `createOrder`, replace the tail (from `const order = await Order.create(...)` to the end of the function):

```js
  const order = await Order.create({
    user: req.user._id,
    customer,
    items: orderItems,
    total,
    paymentReference: paymentReference || "",
  })

  const emailResult = await sendAdminNewOrderEmail(order)
  order.orderNotified = emailResult.ok
  await order.save()

  res.status(201).json(order)
})
```

- [ ] **Step 3: Add `verifyPayment` and `sendProduct` controllers**

Add these new exported functions after `updateOrderStatus` (keep `updateOrderStatus` as-is, for the `cancelled`/manual-override path):

```js
// Admin action: confirms the UPI payment reference was checked and is valid.
// If auto-send is enabled, immediately delivers the product too.
export const verifyPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw new ApiError(404, "Order not found")
  if (order.status !== "pending") {
    throw new ApiError(400, `Cannot verify payment for an order in "${order.status}" status`)
  }

  order.status = "paid"
  await order.save()

  const settings = await PaymentSetting.findOne()
  if (settings?.autoSendOnVerify) {
    const populated = await Order.findById(order._id).populate("items.product", "name slug downloadUrl")
    const result = await sendCustomerDeliveryEmail(populated)
    if (result.ok) {
      populated.status = "fulfilled"
      populated.productSentAt = new Date()
      await populated.save()
      return res.json(populated)
    }
    // Payment is still verified even if the auto-send email failed; admin can retry via "Send Product".
    return res.json(order)
  }

  res.json(order)
})

// Admin action: manually deliver the product to the customer (used when
// auto-send is off, or to retry a failed auto-send).
export const sendProduct = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product", "name slug downloadUrl")
  if (!order) throw new ApiError(404, "Order not found")
  if (order.status !== "paid") {
    throw new ApiError(400, `Cannot send product for an order in "${order.status}" status — payment must be verified first`)
  }

  const result = await sendCustomerDeliveryEmail(order)
  if (!result.ok) {
    throw new ApiError(502, `Failed to send delivery email: ${result.error}`)
  }

  order.status = "fulfilled"
  order.productSentAt = new Date()
  await order.save()
  res.json(order)
})
```

- [ ] **Step 4: Verify with a scratch script against the real DB**

Create a throwaway file `server/verify-order-flow.mjs`. This connects to the real dev DB (from `server/.env`), so run it only against dev data:

```js
import "dotenv/config"
import mongoose from "mongoose"
import Order from "./src/models/Order.js"
import Product from "./src/models/Product.js"
import PaymentSetting from "./src/models/PaymentSetting.js"

await mongoose.connect(process.env.MONGODB_URI)

const product = await Product.findOne({ status: "published" })
if (!product) throw new Error("Seed at least one published product first")

const order = await Order.create({
  customer: { name: "Verify Script", email: process.env.SMTP_USER, phone: "9999999999" },
  items: [{ product: product._id, name: product.name, price: product.price, qty: 1 }],
  total: product.price,
  paymentReference: "VERIFY-SCRIPT-TEST",
})
console.log("created order:", order._id.toString(), order.status)

order.status = "paid"
await order.save()
console.log("marked paid")

const populated = await Order.findById(order._id).populate("items.product", "name slug downloadUrl")
console.log("populated product name:", populated.items[0].product.name)

await Order.findByIdAndDelete(order._id)
console.log("cleaned up test order")

await mongoose.disconnect()
```

Run: `cd server && node verify-order-flow.mjs`
Expected: prints the created order id/status as `pending`, then "marked paid", then the real product name (confirming populate works), then "cleaned up test order" with no errors.

Delete `server/verify-order-flow.mjs` after this passes.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/orderController.js
git commit -m "Add payment-verification and product-delivery order actions"
```

---

### Task 6: Order routes — wire up the two new endpoints

**Files:**
- Modify: `server/src/routes/orderRoutes.js`

**Interfaces:**
- Consumes: `verifyPayment, sendProduct` from `orderController.js` (Task 5).
- Produces: `PUT /api/orders/:id/verify-payment` and `POST /api/orders/:id/send-product`, both admin-only, consumed by the frontend hooks (Task 7).

- [ ] **Step 1: Add the routes**

Replace `server/src/routes/orderRoutes.js` in full:

```js
import { Router } from "express"
import {
  listOrders,
  updateOrderStatus,
  createOrder,
  trackOrder,
  myOrders,
  verifyPayment,
  sendProduct,
} from "../controllers/orderController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listOrders)
router.get("/mine", protect, myOrders)
router.post("/", protect, createOrder)
router.get("/:id/track", trackOrder)
router.put("/:id", protect, adminOnly, updateOrderStatus)
router.put("/:id/verify-payment", protect, adminOnly, verifyPayment)
router.post("/:id/send-product", protect, adminOnly, sendProduct)

export default router
```

- [ ] **Step 2: Verify the server boots and routes are registered**

Run: `cd server && npm run dev` (in background/separate terminal), then in another shell:
`curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/orders/000000000000000000000000/verify-payment -X PUT`

Expected: `401` (route exists and is protected — not `404`). Stop the dev server after checking.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/orderRoutes.js
git commit -m "Add verify-payment and send-product order routes"
```

---

### Task 7: Payment settings controller — accept `autoSendOnVerify`

**Files:**
- Modify: `server/src/controllers/paymentSettingController.js`

**Interfaces:**
- Produces: `PUT /api/payment-settings` now accepts and persists `autoSendOnVerify` (boolean), consumed by the admin Settings page (Task 8).

- [ ] **Step 1: Update `updatePaymentSettings`**

Replace `server/src/controllers/paymentSettingController.js` in full:

```js
import { asyncHandler } from "../utils/asyncHandler.js"
import PaymentSetting from "../models/PaymentSetting.js"

export const getPaymentSettings = asyncHandler(async (req, res) => {
  const settings = (await PaymentSetting.findOne()) || (await PaymentSetting.create({}))
  res.json(settings)
})

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const { upiId, payeeName, qrImage, note, whatsappNumber, autoSendOnVerify } = req.body
  const settings = await PaymentSetting.findOneAndUpdate(
    {},
    { upiId, payeeName, qrImage, note, whatsappNumber, autoSendOnVerify },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  res.json(settings)
})
```

- [ ] **Step 2: Verify field round-trips**

Run: `cd server && node -e "
import('dotenv/config').then(async () => {
  const mongoose = (await import('mongoose')).default
  const PaymentSetting = (await import('./src/models/PaymentSetting.js')).default
  await mongoose.connect(process.env.MONGODB_URI)
  const before = await PaymentSetting.findOneAndUpdate({}, { autoSendOnVerify: true }, { upsert: true, new: true })
  console.log('after set true:', before.autoSendOnVerify)
  await PaymentSetting.findOneAndUpdate({}, { autoSendOnVerify: false })
  console.log('reset to false')
  await mongoose.disconnect()
})
"`

Expected: `after set true: true` then `reset to false`.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/paymentSettingController.js
git commit -m "Persist autoSendOnVerify on payment settings"
```

---

### Task 8: Frontend hooks — verify payment / send product mutations, auto-send setting field

**Files:**
- Modify: `src/hooks/useOrders.js`

**Interfaces:**
- Consumes: `api` from `src/lib/api.js`.
- Produces: `useVerifyOrderPayment()` and `useSendOrderProduct()` mutation hooks, consumed by `OrderList.jsx` (Task 9). Each mutation function takes an order `id` string and returns the updated order.

- [ ] **Step 1: Add the two mutation hooks**

In `src/hooks/useOrders.js`, add after `useUpdateOrderStatus`:

```js
export function useVerifyOrderPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.put(`/orders/${id}/verify-payment`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}

export function useSendOrderProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.post(`/orders/${id}/send-product`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}
```

- [ ] **Step 2: Verify no import/syntax errors**

Run: `cd .. && npx eslint src/hooks/useOrders.js` (run from repo root where the root `package.json`/eslint config lives; if no eslint config matches, instead run `node --check` isn't valid for JSX-free ESM but this file has no JSX, so: `node --input-type=module -e "$(cat src/hooks/useOrders.js)" --check` is unreliable for import.meta-free browser code — simplest check: start the Vite dev server (`npm run dev` at repo root) and confirm no red overlay/console error on the Orders admin page load, done together with Task 9's verification instead of standalone here.)

Skip a standalone check for this task — Task 9's manual browser verification covers it.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOrders.js
git commit -m "Add verify-payment and send-product mutation hooks"
```

---

### Task 9: Admin Orders UI — show products, add action buttons

**Files:**
- Modify: `src/admin/pages/orders/OrderList.jsx`

**Interfaces:**
- Consumes: `useOrders, useUpdateOrderStatus, useVerifyOrderPayment, useSendOrderProduct` from `src/hooks/useOrders.js` (Task 8). Relies on `listOrders` now returning `items[].product = { name, slug, downloadUrl }` (Task 5).

- [ ] **Step 1: Replace the Items column and add action buttons**

Replace `src/admin/pages/orders/OrderList.jsx` in full:

```jsx
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { CheckCircle2, Send } from "lucide-react"
import { useOrders, useUpdateOrderStatus, useVerifyOrderPayment, useSendOrderProduct } from "../../../hooks/useOrders"
import { apiErrorMessage } from "../../../lib/api"
import DataTable from "../../components/DataTable"

const STATUSES = ["pending", "paid", "fulfilled", "cancelled"]

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-sky-500/15 text-sky-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-400",
}

export default function OrderList() {
  const { data: orders, isLoading } = useOrders()
  const updateStatus = useUpdateOrderStatus()
  const verifyPayment = useVerifyOrderPayment()
  const sendProduct = useSendOrderProduct()

  async function handleStatusChange(id, status) {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success("Order status updated")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleVerifyPayment(id) {
    try {
      const updated = await verifyPayment.mutateAsync(id)
      toast.success(updated.status === "fulfilled" ? "Payment verified and product auto-sent" : "Payment verified")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleSendProduct(id) {
    try {
      await sendProduct.mutateAsync(id)
      toast.success("Product sent to customer")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const columns = [
    { key: "_id", label: "Order ID", render: (o) => <span className="font-mono text-xs">{o._id.slice(-8)}</span> },
    {
      key: "customer",
      label: "Customer",
      render: (o) => (
        <div>
          <div className="font-medium text-cloud-100">{o.customer?.name}</div>
          <div className="text-xs text-cloud-500">{o.customer?.email}</div>
        </div>
      ),
    },
    {
      key: "account",
      label: "Account",
      render: (o) =>
        o.user ? (
          <Link to={`/admin/customers/${o.user._id}`} className="text-brand-300 hover:underline">
            {o.user.name}
          </Link>
        ) : (
          <span className="text-cloud-600">Guest</span>
        ),
    },
    {
      key: "items",
      label: "Products",
      render: (o) => (
        <div className="space-y-1">
          {o.items.map((item, idx) => (
            <div key={idx} className="text-xs">
              <span className="text-cloud-200">{item.name}</span>
              <span className="text-cloud-600"> ×{item.qty}</span>
              {item.product?.downloadUrl && o.status === "fulfilled" && (
                <a
                  href={item.product.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 text-brand-300 hover:underline"
                >
                  link
                </a>
              )}
            </div>
          ))}
        </div>
      ),
    },
    { key: "total", label: "Total", render: (o) => `₹${o.total.toLocaleString("en-IN")}` },
    {
      key: "paymentReference",
      label: "UPI Ref",
      render: (o) => o.paymentReference || <span className="text-cloud-600">—</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <select
          value={o.status}
          onChange={(e) => handleStatusChange(o._id, e.target.value)}
          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none ${STATUS_STYLES[o.status]}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-ink-850 text-cloud-100">
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "createdAt", label: "Date", render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ]

  return (
    <DataTable
      columns={columns}
      rows={orders || []}
      loading={isLoading}
      emptyMessage="No orders yet — this fills up once the storefront checkout is live."
      actions={(o) => (
        <>
          {o.status === "pending" && (
            <button
              onClick={() => handleVerifyPayment(o._id)}
              disabled={verifyPayment.isPending}
              className="flex items-center gap-1 rounded-lg bg-sky-500/15 px-2.5 py-1.5 text-xs font-medium text-sky-400 transition hover:bg-sky-500/25 disabled:opacity-60"
            >
              <CheckCircle2 size={13} /> Verify Payment
            </button>
          )}
          {o.status === "paid" && (
            <button
              onClick={() => handleSendProduct(o._id)}
              disabled={sendProduct.isPending}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-60"
            >
              <Send size={13} /> Send Product
            </button>
          )}
          {o.status === "fulfilled" && o.productSentAt && (
            <span className="text-xs text-cloud-500">Sent {new Date(o.productSentAt).toLocaleDateString()}</span>
          )}
        </>
      )}
    />
  )
}
```

- [ ] **Step 2: Manual verification in the browser**

Run: from repo root, `npm run dev` (client) and `cd server && npm run dev` (API), in two terminals.

1. Log in as admin, go to Orders.
2. Confirm the "Products" column shows real product names (not just a count).
3. Find or create a `pending` order → click "Verify Payment" → confirm toast "Payment verified", status badge flips to `paid`, and a "Send Product" button now appears in Actions.
4. Click "Send Product" → confirm toast "Product sent to customer", status flips to `fulfilled`, Actions cell now shows "Sent <date>".
5. Check the customer's email inbox (the one used on the test order) for the invoice email with a working download link.

Expected: all five checks pass with no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/orders/OrderList.jsx
git commit -m "Show per-item products and payment/delivery actions in admin Orders"
```

---

### Task 10: Admin Settings — auto-send toggle

**Files:**
- Modify: `src/admin/pages/Settings.jsx`

**Interfaces:**
- Consumes: `usePaymentSettings, useUpdatePaymentSettings` from `src/hooks/usePaymentSettings.js` (already accepts arbitrary payload fields — no hook change needed since `updatePaymentSettings` just spreads `...form`).

- [ ] **Step 1: Add the toggle to the form state and UI**

In `src/admin/pages/Settings.jsx`:

Change the initial form state (line 12) to include the new field:

```jsx
  const [form, setForm] = useState({ upiId: "", payeeName: "", note: "", whatsappNumber: "", autoSendOnVerify: false })
```

Change the `useEffect` sync block (lines 15-24) to include it:

```jsx
  useEffect(() => {
    if (!settings) return
    setForm({
      upiId: settings.upiId || "",
      payeeName: settings.payeeName || "",
      note: settings.note || "",
      whatsappNumber: settings.whatsappNumber || "",
      autoSendOnVerify: Boolean(settings.autoSendOnVerify),
    })
    setQrImages(settings.qrImage?.url ? [settings.qrImage] : [])
  }, [settings])
```

Add a new block right before the closing `<div className="flex justify-end ...">` (i.e. after the QR Code `<div>` block, before the submit-button div):

```jsx
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-800 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-cloud-100">Auto-send product on payment verification</p>
            <p className="mt-0.5 text-xs text-cloud-500">
              When on, verifying a payment immediately emails the customer their invoice and download
              link. When off, you'll click "Send Product" manually in Orders after verifying.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setField("autoSendOnVerify", !form.autoSendOnVerify)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              form.autoSendOnVerify ? "bg-emerald-500" : "bg-ink-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                form.autoSendOnVerify ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>
```

- [ ] **Step 2: Manual verification in the browser**

With both dev servers running (from Task 9), go to Admin → Settings.

1. Confirm the new toggle row renders below the QR code uploader.
2. Toggle it on, click "Save Settings" → confirm toast "Payment settings saved".
3. Refresh the page → confirm the toggle is still on (persisted).
4. With it on, repeat the pending-order "Verify Payment" flow from Task 9 → confirm the order jumps straight to `fulfilled` (no separate "Send Product" click needed) and the customer email still arrives.
5. Toggle back off and save, to leave the system in manual mode by default.

Expected: all five checks pass.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Settings.jsx
git commit -m "Add auto-send-on-verify toggle to admin payment settings"
```

---

### Task 11: Live preview links always open in a new tab

**Files:**
- Modify: `src/components/home/ProductCard.jsx`
- Modify: `src/components/home/DeliveredWebsiteCard.jsx`

**Interfaces:** None (self-contained UI behavior change; no new props/exports).

- [ ] **Step 1: Fix `ProductCard.jsx`'s internal-preview fallback**

In `src/components/home/ProductCard.jsx`, replace `handlePreviewClick` (lines 52-60):

```jsx
  function handlePreviewClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (product.demoUrl && (product.demoUrl.startsWith("http://") || product.demoUrl.startsWith("https://"))) {
      window.open(product.demoUrl, "_blank", "noopener,noreferrer")
    } else {
      window.open(`/products/${product.slug}?preview=true`, "_blank", "noopener,noreferrer")
    }
  }
```

(Only change: `navigate(...)` → `window.open(..., "_blank", "noopener,noreferrer")`. The `navigate` import from `react-router-dom` becomes unused — remove `const navigate = useNavigate()` on line 22 and the `useNavigate` import on line 2 if nothing else in the file uses it; confirm by searching the file for `navigate` before removing.)

- [ ] **Step 2: Fix `DeliveredWebsiteCard.jsx`'s internal-preview fallback**

In `src/components/home/DeliveredWebsiteCard.jsx`, replace both `onClick={() => navigate(demoUrl)}` occurrences (lines 53-58 and 111-117) with `onClick={() => window.open(demoUrl, "_blank", "noopener,noreferrer")}`:

```jsx
            <button
              onClick={() => window.open(demoUrl, "_blank", "noopener,noreferrer")}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label={`Visit ${product.name}`}
            />
```

and

```jsx
            <button
              onClick={() => window.open(demoUrl, "_blank", "noopener,noreferrer")}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500/10 border border-brand-500/20 py-2.5 px-4 text-xs font-bold text-brand-300 transition hover:bg-brand-500/20 hover:text-white cursor-pointer"
            >
              <Eye size={14} /> View Website <ExternalLink size={12} />
            </button>
```

Remove the now-unused `const navigate = useNavigate()` (line 6) and the `useNavigate` import (line 2) if nothing else in the file uses `navigate` — confirm by searching the file first.

- [ ] **Step 3: Manual verification in the browser**

With the client dev server running:

1. Go to the homepage, find a product card for a product with no `demoUrl` set (or set one to `""` in the DB temporarily via admin).
2. Click "Live Preview" on that card → confirm it opens `/products/<slug>?preview=true` in a **new browser tab**, not the current tab.
3. Find a "Delivered Website" card (if present on the homepage) for a product with no `demoUrl` → click it → confirm it also opens in a new tab.
4. Spot-check a product that **does** have a `demoUrl` → confirm preview still opens in a new tab (unchanged behavior).

Expected: all four checks pass, no console errors, no unused-import lint warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/ProductCard.jsx src/components/home/DeliveredWebsiteCard.jsx
git commit -m "Open all live-preview links in a new tab"
```

---

## Post-plan note

After all tasks land, do one end-to-end smoke test as a real user would: place an order through the actual storefront checkout (not a script), confirm the admin email arrives, verify payment and send the product from the admin UI, and confirm the customer invoice email arrives with a working download link.
