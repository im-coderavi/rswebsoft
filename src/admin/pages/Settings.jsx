import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import toast from "react-hot-toast"
import { usePaymentSettings, useUpdatePaymentSettings } from "../../hooks/usePaymentSettings"
import { apiErrorMessage } from "../../lib/api"
import ImageUploader from "../components/ImageUploader"
import WhatsappAlertSettings from "../components/WhatsappAlertSettings"

export default function Settings() {
  const { data: settings, isLoading } = usePaymentSettings()
  const updateSettings = useUpdatePaymentSettings()

  const [form, setForm] = useState({ upiId: "", payeeName: "", note: "", whatsappNumber: "", autoSendOnVerify: false })
  const [qrImages, setQrImages] = useState([])

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

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await updateSettings.mutateAsync({
        ...form,
        qrImage: qrImages[0] || { url: "", publicId: "" },
      })
      toast.success("Payment settings saved")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  if (isLoading) return <p className="text-cloud-400">Loading settings…</p>

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-5 text-sm text-cloud-400">
        Buyers see this UPI QR and ID at checkout. They pay you directly and submit their
        transaction reference — verify it manually, then mark their order paid/fulfilled in Orders.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/8 bg-ink-850 p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">UPI ID</label>
          <input
            value={form.upiId}
            onChange={(e) => setField("upiId", e.target.value)}
            placeholder="yourname@upi"
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Payee Name</label>
          <input
            value={form.payeeName}
            onChange={(e) => setField("payeeName", e.target.value)}
            placeholder="e.g. RSWebSoft"
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            WhatsApp Number <span className="text-cloud-500">(with country code, e.g. 919876543210 — used for the "Buy on WhatsApp" button on package cards)</span>
          </label>
          <input
            value={form.whatsappNumber}
            onChange={(e) => setField("whatsappNumber", e.target.value)}
            placeholder="919876543210"
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Note for buyers (optional)</label>
          <textarea
            rows={2}
            value={form.note}
            onChange={(e) => setField("note", e.target.value)}
            placeholder="e.g. Please include your order email in the payment note"
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">UPI QR Code</label>
          <ImageUploader images={qrImages} onChange={setQrImages} max={1} />
        </div>

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

        <div className="flex justify-end border-t border-white/8 pt-5">
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <Save size={16} /> {updateSettings.isPending ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>

      <div className="mt-5">
        <WhatsappAlertSettings />
      </div>
    </div>
  )
}
