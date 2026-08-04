import path from "path"
import { fileURLToPath } from "url"
import transporter, { mailFrom, adminNotifyEmail } from "../config/mail.js"
import { renderTemplate } from "../utils/renderTemplate.js"
import { escapeHtml } from "../utils/escapeHtml.js"

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
          `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(item.name)}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">${item.qty}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">₹${formatMoney(item.price)}</td></tr>`
      )
      .join("")

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "adminNewOrder.html"), {
      orderId: String(order._id).slice(-8),
      customerName: escapeHtml(order.customer.name),
      customerEmail: escapeHtml(order.customer.email),
      customerPhone: escapeHtml(order.customer.phone),
      itemsRows,
      total: formatMoney(order.total),
      paymentReference: order.paymentReference ? escapeHtml(order.paymentReference) : "—",
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

// `licences` are the keys issued for this order. The email carries the keys and
// a link to the account page — never the download URL or its password. That is
// the whole point: forwarding this message must not hand over the files.
export async function sendCustomerDeliveryEmail(order, licences = []) {
  try {
    const itemsRows = order.items
      .map(
        (item) =>
          `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(item.name)}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">${item.qty}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">₹${formatMoney(item.price)}</td></tr>`
      )
      .join("")

    const licenceRows = licences
      .map(
        (l) =>
          `<div style="margin-top:10px;"><div style="font-size:12px;color:#64748b;">${escapeHtml(l.productName)}</div><div style="font-size:19px;font-weight:bold;color:#0f172a;letter-spacing:1.5px;font-family:monospace;">${escapeHtml(l.key)}</div></div>`
      )
      .join("")

    const discountRow = order.discountAmount > 0
      ? `<p style="margin:16px 0 0;font-size:13px;color:#059669;">Coupon ${escapeHtml(order.couponCode)} applied: −₹${formatMoney(order.discountAmount)}</p>`
      : ""

    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "")

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "customerDelivery.html"), {
      orderId: String(order._id).slice(-8),
      customerName: escapeHtml(order.customer.name),
      itemsRows,
      licenceRows,
      licenceWord: licences.length === 1 ? "key" : "keys",
      downloadsUrl: `${clientUrl}/account/downloads`,
      discountRow,
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

export async function sendWelcomeEmail(user) {
  try {
    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "")

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "welcome.html"), {
      customerName: escapeHtml(user.name),
      customerEmail: escapeHtml(user.email),
      userId: escapeHtml(user.userId),
      loginUrl: `${clientUrl}/login`,
    })

    await transporter.sendMail({
      from: mailFrom,
      to: user.email,
      subject: `Welcome to RSWebSoft — your User ID is ${user.userId}`,
      html,
    })

    return { ok: true }
  } catch (err) {
    console.error("sendWelcomeEmail failed:", err.message)
    return { ok: false, error: err.message }
  }
}

export async function sendPasswordResetEmail(user, rawToken) {
  try {
    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "")
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "passwordReset.html"), {
      customerName: escapeHtml(user.name),
      resetUrl,
    })

    await transporter.sendMail({
      from: mailFrom,
      to: user.email,
      subject: "Reset your RSWebSoft password",
      html,
    })

    return { ok: true }
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err.message)
    return { ok: false, error: err.message }
  }
}
