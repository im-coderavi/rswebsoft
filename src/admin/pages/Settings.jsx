import { useEffect, useState } from "react"
import { Save } from "lucide-react"
import toast from "react-hot-toast"
import { usePaymentSettings, useUpdatePaymentSettings } from "../../hooks/usePaymentSettings"
import { apiErrorMessage } from "../../lib/api"
import ImageUploader from "../components/ImageUploader"

export default function Settings() {
  const { data: settings, isLoading } = usePaymentSettings()
  const updateSettings = useUpdatePaymentSettings()

  const [form, setForm] = useState({ upiId: "", payeeName: "", note: "", whatsappNumber: "" })
  const [qrImages, setQrImages] = useState([])

  useEffect(() => {
    if (!settings) return
    setForm({
      upiId: settings.upiId || "",
      payeeName: settings.payeeName || "",
      note: settings.note || "",
      whatsappNumber: settings.whatsappNumber || "",
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
    </div>
  )
}
