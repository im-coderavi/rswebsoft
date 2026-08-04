import { Link } from "react-router-dom"

// One shell for login / register / forgot / reset so the four pages read as a
// set rather than four separately-invented forms.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <section className="container-rs flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient font-display text-sm font-bold text-white">
            RS
          </span>
          <span className="font-display text-lg font-bold text-cloud-100">RSWebSoft</span>
        </Link>

        <div className="rounded-2xl border border-ink-800 bg-ink-850 p-7 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-cloud-100">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-cloud-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-cloud-400">{footer}</div>}
      </div>
    </section>
  )
}
