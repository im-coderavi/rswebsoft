import { motion } from "framer-motion"
import {
  FileText,
  Video,
  BookOpen,
  Download,
  HelpCircle,
  Code2,
  ArrowRight,
} from "lucide-react"
import Reveal, { RevealGroup, RevealItem } from "../components/ui/Reveal"

const resources = [
  {
    icon: FileText,
    title: "Documentation",
    desc: "Comprehensive guides and API references for every product. Step-by-step setup instructions included.",
    tone: "from-brand-600 to-brand-700",
    link: "#",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    desc: "Watch detailed walkthroughs and learn how to set up, customize, and extend our products.",
    tone: "from-violet-600 to-purple-700",
    link: "#",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    desc: "Find answers to common questions, troubleshooting tips, and best practices.",
    tone: "from-cyan-600 to-blue-700",
    link: "#",
  },
  {
    icon: Download,
    title: "Downloads",
    desc: "Access free sample files, starter kits, and demo content packs for quick evaluation.",
    tone: "from-emerald-600 to-teal-700",
    link: "#",
  },
  {
    icon: Code2,
    title: "Developer API",
    desc: "REST API documentation for integrating our products into your custom workflows.",
    tone: "from-amber-600 to-orange-700",
    link: "#",
  },
  {
    icon: HelpCircle,
    title: "Installation Guide",
    desc: "Quick start guides for WordPress, standalone apps, and SaaS tools — be live in minutes.",
    tone: "from-rose-600 to-pink-700",
    link: "#",
  },
]

export default function Resources() {
  return (
    <div className="container-rs py-10 sm:py-14">
      {/* Header */}
      <Reveal className="mb-10">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cloud-100 sm:text-3xl">
          Resources
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-cloud-400">
          Everything you need to get the most out of our products — documentation, tutorials, downloads, and developer tools.
        </p>
      </Reveal>

      {/* Resource Cards Grid */}
      <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map(({ icon: Icon, title, desc, tone, link }) => (
          <RevealItem
            key={title}
            className="group relative overflow-hidden rounded-2xl border border-white/8 bg-ink-850 p-6 transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-black/30"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-600/8 blur-2xl transition group-hover:bg-brand-600/15" />
            <span
              className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-lg transition group-hover:scale-110`}
            >
              <Icon size={22} />
            </span>
            <h3 className="mb-2 text-base font-bold text-cloud-100">{title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-cloud-400">{desc}</p>
            <a
              href={link}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition hover:text-brand-300"
            >
              Explore <ArrowRight size={14} />
            </a>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* CTA Section */}
      <Reveal delay={0.2} className="mt-12">
        <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-brand-gradient-soft p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-cloud-100 sm:text-2xl">
                Can't find what you're looking for?
              </h2>
              <p className="mt-1 text-sm text-cloud-400">
                Our support team is available 24/7 to help you with any questions.
              </p>
            </div>
            <a
              href="/support"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow"
            >
              Contact Support <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
