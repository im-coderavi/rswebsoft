import { Link } from "react-router-dom"
import { Construction, ArrowLeft } from "lucide-react"

export default function Placeholder({ title }) {
  return (
    <section className="container-rs flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-300">
        <Construction size={30} />
      </span>
      <h1 className="font-display text-3xl font-bold text-cloud-100">{title}</h1>
      <p className="mt-2 max-w-sm text-cloud-400">
        This page is coming soon. The home page is the current focus of the build.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>
    </section>
  )
}
