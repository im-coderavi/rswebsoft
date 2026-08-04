import NotificationSetting from "../models/NotificationSetting.js"
import { clientUrl } from "../utils/clientUrl.js"

const CALLMEBOT_ENDPOINT = "https://api.callmebot.com/whatsapp.php"

// CallMeBot is a free third-party relay with no uptime guarantee, so this must
// never be able to take an order down with it. Every path returns
// { ok, error? } and nothing in here throws.
const REQUEST_TIMEOUT_MS = 10000

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-IN")
}

// Digits only, with the country code. "9582891675" and "+91 95828 91675" both
// become "919582891675", which is the shape CallMeBot expects.
export function toWhatsappNumber(raw) {
  if (typeof raw !== "string") return null

  let digits = raw.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1)
  if (digits.length === 10) digits = `91${digits}`

  if (digits.length < 11 || digits.length > 15) return null
  return digits
}

async function send(text) {
  const settings = await NotificationSetting.findOne()

  if (!settings?.whatsappEnabled) return { ok: false, error: "disabled" }

  const phone = toWhatsappNumber(settings.whatsappPhone)
  if (!phone || !settings.whatsappApiKey) {
    return { ok: false, error: "WhatsApp alerts are switched on but the number or API key is missing" }
  }

  const url =
    `${CALLMEBOT_ENDPOINT}?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}` +
    `&apikey=${encodeURIComponent(settings.whatsappApiKey)}`

  let result
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const body = await response.text()

    // CallMeBot answers 200 with an HTML page either way, so the status alone
    // doesn't tell us much — look for its failure wording too.
    const looksFailed = /error|invalid|not.*allow|apikey/i.test(body) && !/queued|sent|success/i.test(body)

    result = response.ok && !looksFailed
      ? { ok: true }
      : { ok: false, error: `CallMeBot replied ${response.status}: ${body.replace(/<[^>]+>/g, " ").trim().slice(0, 160)}` }
  } catch (err) {
    result = { ok: false, error: err.name === "TimeoutError" ? "CallMeBot did not respond in time" : err.message }
  }

  // Recorded so the admin screen can show whether alerts are actually landing.
  await NotificationSetting.updateOne(
    { _id: settings._id },
    {
      $set: {
        lastAttemptAt: new Date(),
        lastResult: result.ok ? "ok" : "failed",
        lastError: result.ok ? "" : String(result.error).slice(0, 300),
      },
    }
  )

  if (!result.ok) console.error("WhatsApp alert failed:", result.error)
  return result
}

// Keeps the message short enough to survive being carried in a GET query
// string, which is how CallMeBot takes it.
const MAX_ITEMS_LISTED = 5

// Cut down to a name that still reads on a phone. Product names here run to
// 60+ characters, which wraps into a wall of text on a small screen.
function shortName(name = "") {
  const clean = String(name).trim()
  return clean.length > 38 ? `${clean.slice(0, 37)}…` : clean
}

export async function sendNewOrderWhatsapp(order) {
  const shortId = String(order._id).slice(-8)
  const items = order.items ?? []
  const admin = clientUrl()

  const itemLines = items
    .slice(0, MAX_ITEMS_LISTED)
    .map((i) => `• ${shortName(i.name)} ×${i.qty} — ₹${formatMoney(i.price * i.qty)}`)
  if (items.length > MAX_ITEMS_LISTED) {
    itemLines.push(`• _+${items.length - MAX_ITEMS_LISTED} more_`)
  }

  const customerNumber = toWhatsappNumber(order.customer?.phone ?? "")

  const lines = [
    `🛒 *New order · ₹${formatMoney(order.total)}*`,
    `_#${shortId}_`,
    "",
    `*${order.customer?.name ?? "Unknown"}*`,
    order.customer?.phone ? `📞 ${order.customer.phone}` : null,
    order.customer?.email ? `✉️ ${order.customer.email}` : null,
    "",
    ...itemLines,
  ]

  if (order.discountAmount > 0) {
    lines.push("", `🏷️ ${order.couponCode} · −₹${formatMoney(order.discountAmount)}`)
  }

  lines.push(
    "",
    order.paymentReference
      ? `💳 UPI ref *${order.paymentReference}*`
      : "⚠️ *No UPI reference given*",
    "",
    "*Verify this order*",
    // Lands on the Orders table already filtered to this one — see the
    // ?order= handling in the admin OrderList.
    `${admin}/admin/orders?order=${shortId}`
  )

  if (customerNumber) {
    lines.push("", `*Message ${order.customer.name?.split(" ")[0] ?? "the buyer"}*`, `https://wa.me/${customerNumber}`)
  }

  return send(lines.filter((l) => l !== null).join("\n"))
}

export async function sendTestWhatsapp() {
  return send(
    "*RSWebSoft test message*\nIf you're reading this, new-order alerts will reach this number."
  )
}
