import { useEffect, useState } from "react"
import { MessageCircle, Save } from "lucide-react"
import toast from "react-hot-toast"
import TypedProductList from "./TypedProductList"
import {
  useDeliveredWebsiteSettings,
  useUpdateDeliveredWebsiteSettings,
} from "../../../hooks/useDeliveredWebsiteSettings"
import { apiErrorMessage } from "../../../lib/api"

// The number every delivered-website card's Contact button opens a chat with.
// One setting for the whole showcase — an enquiry lands with the shop owner
// whichever website prompted it.
function ContactSettings() {
  const { data: settings, isLoading } = useDeliveredWebsiteSettings()
  const update = useUpdateDeliveredWebsiteSettings()
  const [value, setValue] = useState("")
  const [touched, setTouched] = useState(false)

  // Seed the input once the saved value arrives, but never stomp on what the
  // admin is part-way through typing.
  useEffect(() => {
    if (settings && !touched) setValue(settings.whatsappNumber ?? "")
  }, [settings, touched])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const saved = await update.mutateAsync({ whatsappNumber: value })
      setValue(saved.whatsappNumber ?? "")
      setTouched(false)
      toast.success(
        saved.whatsappNumber ? "Contact number saved" : "Contact button hidden from the showcase"
      )
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 rounded-2xl border border-ink-800 bg-ink-850 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <MessageCircle size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-cloud-100">Enquiry WhatsApp number</h2>
          <p className="mt-1 text-xs text-cloud-500">
            Shown as a Contact button on every delivered website on the homepage. Leave it empty to
            hide the button.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setTouched(true)
              }}
              disabled={isLoading}
              placeholder="98765 43210"
              className="w-56 rounded-lg border border-ink-700 bg-ink-800 px-3.5 py-2 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={update.isPending || isLoading}
              className="flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              <Save size={15} /> {update.isPending ? "Saving…" : "Save"}
            </button>
            {settings?.whatsappNumber && !touched && (
              <span className="text-xs text-cloud-500">
                Chats open with <span className="font-mono text-cloud-300">+{settings.whatsappNumber}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}

export default function DeliveredWebsiteList() {
  return (
    <div>
      <ContactSettings />
      <TypedProductList
        type="delivered-website"
        newLabel="New Delivered Website"
        emptyMessage="No delivered websites yet — add one to show it in the homepage showcase."
      />
    </div>
  )
}
