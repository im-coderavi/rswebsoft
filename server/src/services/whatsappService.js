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

export async function sendNewOrderWhatsapp(order) {
  const itemCount = order.items?.reduce((sum, i) => sum + (i.qty || 1), 0) ?? 0
  const first = order.items?.[0]?.name ?? "an item"
  const extra = order.items?.length > 1 ? ` +${order.items.length - 1} more` : ""

  const text = [
    `*New order* #${String(order._id).slice(-8)}`,
    `₹${formatMoney(order.total)} · ${order.customer?.name ?? "Unknown"}`,
    `${itemCount} item${itemCount === 1 ? "" : "s"}: ${first}${extra}`,
    order.paymentReference ? `UPI ref: ${order.paymentReference}` : "No UPI ref given",
    "",
    `Verify: ${clientUrl()}/admin/orders`,
  ].join("\n")

  return send(text)
}

export async function sendTestWhatsapp() {
  return send(
    "*RSWebSoft test message*\nIf you're reading this, new-order alerts will reach this number."
  )
}
