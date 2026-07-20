import { useState } from "react"
import {
  Headphones,
  MessageCircle,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Send,
  Phone,
  MapPin,
} from "lucide-react"
import Reveal, { RevealGroup, RevealItem } from "../components/ui/Reveal"

const faqs = [
  {
    q: "How do I download my purchased product?",
    a: "After successful payment verification, you'll receive a download link via email. You can also find it in your order confirmation page.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept UPI (Google Pay, PhonePe, Paytm), Net Banking, Credit/Debit Cards, and PayPal for international customers.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes, we offer a 7-day refund policy for unused products. If you face any issues, contact our support team with your order details.",
  },
  {
    q: "How long does delivery take?",
    a: "Digital products are delivered instantly after payment verification. UPI payments are usually verified within 5–15 minutes.",
  },
  {
    q: "Do products include future updates?",
    a: "Yes, all products include free updates for the duration mentioned on the product page. Most products offer lifetime updates.",
  },
  {
    q: "Can I use a product on multiple websites?",
    a: "License terms vary by product. Single-site and multi-site licenses are clearly mentioned on each product page.",
  },
]

const contactMethods = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    desc: "Chat with our support team in real-time",
    action: "Start Chat",
    available: "Mon–Sat, 10 AM – 8 PM IST",
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "Get a detailed response within 24 hours",
    action: "support@rswebsoft.com",
    available: "Response within 24 hours",
  },
  {
    icon: Phone,
    title: "Phone Support",
    desc: "Talk directly with our support team",
    action: "Call Now",
    available: "Mon–Fri, 10 AM – 6 PM IST",
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/8 bg-ink-850 transition hover:border-brand-500/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-cloud-100">{q}</span>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-brand-400" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-cloud-500" />
        )}
      </button>
      {open && (
        <div className="border-t border-white/5 px-5 py-4">
          <p className="text-sm leading-relaxed text-cloud-400">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function Support() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

  function handleSubmit(e) {
    e.preventDefault()
    // placeholder — integrate with backend later
    alert("Thank you! Your message has been sent. We'll get back to you soon.")
    setForm({ name: "", email: "", subject: "", message: "" })
  }

  return (
    <div className="container-rs py-10 sm:py-14">
      {/* Header */}
      <Reveal className="mb-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cloud-100 sm:text-3xl">
          Support Center
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-cloud-400">
          We're here to help. Reach out through any channel or browse our frequently asked questions below.
        </p>
      </Reveal>

      {/* Contact Methods */}
      <RevealGroup className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {contactMethods.map(({ icon: Icon, title, desc, action, available }) => (
          <RevealItem
            key={title}
            className="group rounded-2xl border border-white/8 bg-ink-850 p-6 transition hover:-translate-y-0.5 hover:border-brand-500/40"
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300 transition group-hover:scale-110">
              <Icon size={22} />
            </span>
            <h3 className="mb-1 text-base font-bold text-cloud-100">{title}</h3>
            <p className="mb-3 text-sm text-cloud-400">{desc}</p>
            <p className="text-sm font-semibold text-brand-400">{action}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-cloud-500">
              <Clock size={12} /> {available}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Two-column: FAQ + Contact Form */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* FAQs */}
        <Reveal>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300">
              <FileQuestion size={20} />
            </span>
            <h2 className="font-display text-xl font-bold text-cloud-100">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} {...faq} />
            ))}
          </div>
        </Reveal>

        {/* Contact Form */}
        <Reveal delay={0.1}>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient-soft text-brand-300">
              <Send size={20} />
            </span>
            <h2 className="font-display text-xl font-bold text-cloud-100">
              Send Us a Message
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/8 bg-ink-850 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-cloud-300">Your Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-cloud-300">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-cloud-300">Subject</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
                className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-cloud-300">Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue or question in detail..."
                className="w-full resize-none rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow sm:w-auto"
            >
              <Send size={16} /> Send Message
            </button>
          </form>

          {/* Office Info */}
          <div className="mt-6 rounded-xl border border-white/8 bg-ink-850 p-5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-400" />
              <div>
                <p className="text-sm font-semibold text-cloud-100">Office Address</p>
                <p className="mt-1 text-sm text-cloud-400">
                  RSWebSoft Digital Solutions<br />
                  India
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
