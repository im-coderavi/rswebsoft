import { ArrowUp, ShieldCheck } from "lucide-react"
import { Facebook, Twitter, Linkedin, Youtube } from "../ui/SocialIcons"
import Logo from "../ui/Logo"
import { footerColumns, footerBottomLinks } from "../../data/site"

const socials = [Facebook, Twitter, Linkedin, Youtube]
const payments = ["VISA", "MC", "PayPal", "Razorpay", "AMEX"]

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-ink-900">
      <div className="container-rs py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-[1.7fr_repeat(6,minmax(0,1fr))]">
          {/* brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cloud-400">
              All types of digital products, themes, plugins, tools and developer
              resources in one place.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((S, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-ink-800 text-cloud-300 transition hover:border-brand-500/40 hover:text-brand-300"
                >
                  <S size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="lg:col-span-1">
              <h3 className="mb-3.5 text-sm font-bold text-cloud-100">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[13px] text-cloud-400 transition hover:text-brand-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* payments */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h3 className="mb-3.5 text-sm font-bold text-cloud-100">We Accept</h3>
            <div className="flex flex-wrap gap-1.5">
              {payments.map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-[10px] font-bold text-cloud-300"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <ShieldCheck size={14} /> 100% Secure Payments
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/8">
        <div className="container-rs flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-cloud-500">© 2024 RSWebSoft. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {footerBottomLinks.map((link) => (
              <a key={link} href="#" className="text-xs text-cloud-400 transition hover:text-brand-300">
                {link}
              </a>
            ))}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
            >
              <ArrowUp size={13} /> Back to Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
