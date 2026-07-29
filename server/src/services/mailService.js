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

export async function sendCustomerDeliveryEmail(order) {
  try {
    const itemsRows = order.items
      .map((item) => {
        const downloadUrl = item.product?.downloadUrl || ""
        const link = downloadUrl
          ? `<a href="${downloadUrl}" style="color:#059669;">Download</a>`
          : "—"
        return `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(item.name)}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">${item.qty}</td><td align="right" style="padding:8px;border:1px solid #e2e8f0;">₹${formatMoney(item.price)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${link}</td></tr>`
      })
      .join("")

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "customerDelivery.html"), {
      orderId: String(order._id).slice(-8),
      customerName: escapeHtml(order.customer.name),
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
