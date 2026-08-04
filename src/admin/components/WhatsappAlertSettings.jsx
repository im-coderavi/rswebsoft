import { useEffect, useState } from "react"
import { MessageCircle, Save, Send, CheckCircle2, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  useTestNotification,
} from "../../hooks/useNotificationSettings"
import { apiErrorMessage } from "../../lib/api"

// Alerts go out through CallMeBot, a free third-party relay. It has no uptime
// promise and its own terms describe it as personal use, so the panel shows
// whether the last attempt actually landed rather than assuming it did — and
// the order email stays the channel that's guaranteed to arrive.
export default function WhatsappAlertSettings() {
  const { data: settings, isLoading } = useNotificationSettings()
  const update = useUpdateNotificationSettings()
  const test = useTestNotification()

  const [form, setForm] = useState({ whatsappEnabled: false, whatsappPhone: "", whatsappApiKey: "" })
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!settings || touched) return
    setForm({
      whatsappEnabled: Boolean(settings.whatsappEnabled),
      whatsappPhone: settings.whatsappPhone || "",
      whatsappApiKey: settings.whatsappApiKey || "",
    })
  }, [settings, touched])

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setTouched(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await update.mutateAsync(form)
      setTouched(false)
      toast.success("Alert settings saved")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleTest() {
    try {
      const result = await test.mutateAsync()
      toast.success(result.message)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const lastFailed = settings?.lastResult === "failed"
  const lastOk = settings?.lastResult === "ok"

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-800 bg-ink-850 p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <MessageCircle size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-cloud-100">WhatsApp alert on new orders</h2>
          <p className="mt-1 text-xs text-cloud-500">
            Sent through CallMeBot, a free service. Treat it as a convenience — the order email is
            the channel that always arrives.
          </p>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.whatsappEnabled}
              onChange={(e) => setField("whatsappEnabled", e.target.checked)}
              className="checkbox-rs"
            />
            <span className="text-sm text-cloud-200">Send me a WhatsApp when an order comes in</span>
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                Your WhatsApp number <span className="text-cloud-500">(with country code)</span>
              </label>
              <input
                value={form.whatsappPhone}
                onChange={(e) => setField("whatsappPhone", e.target.value)}
                disabled={isLoading}
                placeholder="919582891675"
                className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3.5 py-2 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-cloud-400">
                CallMeBot API key
              </label>
              <input
                value={form.whatsappApiKey}
                onChange={(e) => setField("whatsappApiKey", e.target.value)}
                disabled={isLoading}
                placeholder="123456"
                className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3.5 py-2 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <details className="mt-3 text-xs text-cloud-500">
            <summary className="cursor-pointer hover:text-cloud-300">How to get the API key</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                Save <span className="font-mono text-cloud-300">+34 644 05 92 17</span> in your
                phone contacts.
              </li>
              <li>
                From the number above, WhatsApp it:{" "}
                <span className="text-cloud-300">"I allow callmebot to send me messages"</span>
              </li>
              <li>It replies with your API key within a couple of minutes. Paste it here.</li>
            </ol>
          </details>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              disabled={update.isPending}
              className="flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              <Save size={15} /> {update.isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={test.isPending || touched}
              title={touched ? "Save your changes first" : undefined}
              className="flex items-center gap-2 rounded-lg border border-ink-700 px-4 py-2 text-sm font-semibold text-cloud-200 transition hover:bg-ink-800 disabled:opacity-40"
            >
              <Send size={15} /> {test.isPending ? "Sending…" : "Send test message"}
            </button>
          </div>

          {settings?.lastAttemptAt && (
            <p
              className={`mt-3 flex items-start gap-1.5 text-xs ${
                lastFailed ? "text-status-bad" : "text-status-ok"
              }`}
            >
              {lastOk ? (
                <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              )}
              <span>
                Last attempt{" "}
                {new Date(settings.lastAttemptAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                : {lastOk ? "delivered" : settings.lastError || "failed"}
              </span>
            </p>
          )}
        </div>
      </div>
    </form>
  )
}
