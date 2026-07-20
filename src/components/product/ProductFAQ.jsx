import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

const FAQS = [
  {
    q: "How do I receive the product after buying?",
    a: "After you submit your UPI payment reference at checkout, our team manually verifies the payment. Once confirmed, your download link unlocks on your order tracking page — just bookmark it after checkout.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Currently we accept UPI payments only. Scan the QR code or use the UPI ID shown at checkout, then submit your transaction reference to complete your order.",
  },
  {
    q: "Can I get a refund?",
    a: "Since these are instantly downloadable digital products, refunds are considered case-by-case for genuine issues (broken files, major defects). Contact support with your order ID.",
  },
  {
    q: "Do you provide support after purchase?",
    a: "Yes — every product includes basic support. Reach out via the Contact Us page with your order ID and question.",
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/8 py-4 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-semibold text-cloud-100">{q}</span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-cloud-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="mt-2.5 text-sm leading-relaxed text-cloud-400">{a}</p>}
    </div>
  )
}

export default function ProductFAQ() {
  return (
    <div className="mt-10 border-t border-white/8 pt-8">
      <div className="mb-2 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300">
          <HelpCircle size={18} />
        </span>
        <h2 className="font-display text-xl font-bold text-cloud-100">Frequently Asked Questions</h2>
      </div>
      <div>
        {FAQS.map((f) => (
          <FAQItem key={f.q} {...f} />
        ))}
      </div>
    </div>
  )
}
