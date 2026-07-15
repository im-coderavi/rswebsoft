import { Link } from "react-router-dom"
import { 
  ShoppingCart, Code2, ShoppingBag, Key, Wrench, 
  LayoutTemplate, Smile, User, Globe, ExternalLink, 
  ArrowRight, Rocket 
} from "lucide-react"
import { motion } from "framer-motion"

// Custom G-letter icon for GPThemeMart
function GLetterIcon({ size = 28, className }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 11.5a7.5 7.5 0 1 1-2.2-5.3L13 10h6v1.5Z" />
    </svg>
  )
}

// Configuration for each brand's styles, colors, and layout
const BRAND_METADATA = {
  wpkartpro: {
    icon: ShoppingCart,
    iconColor: "text-[#a855f7]",
    part1: "wpkart",
    part2: "pro",
    part2Color: "text-[#a855f7]",
    badgeBg: "bg-purple-50 dark:bg-purple-950/20",
    badgeBorder: "border-purple-200 dark:border-purple-800/30",
    badgeText: "text-purple-600 dark:text-purple-400",
    linkBg: "bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-950/15 dark:hover:bg-purple-900/20",
    linkText: "text-purple-600 dark:text-purple-300",
  },
  codexbazaar: {
    icon: Code2,
    iconColor: "text-[#2563eb]",
    part1: "codex",
    part2: "bazaar",
    part2Color: "text-[#2563eb]",
    badgeBg: "bg-blue-50 dark:bg-blue-950/20",
    badgeBorder: "border-blue-200 dark:border-blue-800/30",
    badgeText: "text-blue-600 dark:text-blue-400",
    linkBg: "bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/15 dark:hover:bg-blue-900/20",
    linkText: "text-blue-600 dark:text-blue-300",
  },
  wpmart99: {
    icon: ShoppingBag,
    iconColor: "text-[#22c55e]",
    part1: "wpmart",
    part2: "99",
    part2Color: "text-[#22c55e]",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/20",
    badgeBorder: "border-emerald-200 dark:border-emerald-800/30",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    linkBg: "bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/15 dark:hover:bg-emerald-900/20",
    linkText: "text-emerald-600 dark:text-emerald-300",
  },
  wpkeyhub: {
    icon: Key,
    iconColor: "text-[#a855f7]",
    part1: "wpkey",
    part2: "hub",
    part2Color: "text-[#a855f7]",
    badgeBg: "bg-purple-50 dark:bg-purple-950/20",
    badgeBorder: "border-purple-200 dark:border-purple-800/30",
    badgeText: "text-purple-600 dark:text-purple-400",
    linkBg: "bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-950/15 dark:hover:bg-purple-900/20",
    linkText: "text-purple-600 dark:text-purple-300",
  },
  toolzypro: {
    icon: Wrench,
    iconColor: "text-[#2563eb]",
    part1: "toolzy",
    part2: "pro",
    part2Color: "text-[#2563eb]",
    badgeBg: "bg-blue-50 dark:bg-blue-950/20",
    badgeBorder: "border-blue-200 dark:border-blue-800/30",
    badgeText: "text-blue-600 dark:text-blue-400",
    linkBg: "bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/15 dark:hover:bg-blue-900/20",
    linkText: "text-blue-600 dark:text-blue-300",
  },
  wptemplateshub: {
    icon: LayoutTemplate,
    iconColor: "text-[#06b6d4]",
    part1: "wptemplates",
    part2: "hub",
    part2Color: "text-[#06b6d4]",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/20",
    badgeBorder: "border-cyan-200 dark:border-cyan-800/30",
    badgeText: "text-cyan-600 dark:text-cyan-400",
    linkBg: "bg-cyan-50 hover:bg-cyan-100/80 dark:bg-cyan-950/15 dark:hover:bg-cyan-900/20",
    linkText: "text-cyan-600 dark:text-cyan-300",
  },
  appsclap: {
    icon: Smile,
    iconColor: "text-[#ea580c]",
    part1: "apps",
    part2: "clap",
    part2Color: "text-[#ea580c]",
    badgeBg: "bg-orange-50 dark:bg-orange-950/20",
    badgeBorder: "border-orange-200 dark:border-orange-800/30",
    badgeText: "text-orange-600 dark:text-orange-400",
    linkBg: "bg-orange-50 hover:bg-orange-100/80 dark:bg-orange-950/15 dark:hover:bg-orange-900/20",
    linkText: "text-orange-600 dark:text-orange-300",
  },
  gpthememart: {
    icon: GLetterIcon,
    iconColor: "text-[#ec4899]",
    part1: "gptheme",
    part2: "mart",
    part2Color: "text-[#ec4899]",
    badgeBg: "bg-pink-50 dark:bg-pink-950/20",
    badgeBorder: "border-pink-200 dark:border-pink-800/30",
    badgeText: "text-pink-600 dark:text-pink-400",
    linkBg: "bg-pink-50 hover:bg-pink-100/80 dark:bg-pink-950/15 dark:hover:bg-pink-900/20",
    linkText: "text-pink-600 dark:text-pink-300",
  },
  bizzprofile: {
    icon: User,
    iconColor: "text-[#22c55e]",
    part1: "bizz",
    part2: "profile",
    part2Color: "text-[#22c55e]",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/20",
    badgeBorder: "border-emerald-200 dark:border-emerald-800/30",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    linkBg: "bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/15 dark:hover:bg-emerald-900/20",
    linkText: "text-emerald-600 dark:text-emerald-300",
  },
  rswebsoft: {
    icon: Globe,
    iconColor: "text-[#ea580c]",
    part1: "rsweb",
    part2: "soft",
    part2Color: "text-[#ea580c]",
    badgeBg: "bg-orange-50 dark:bg-orange-950/20",
    badgeBorder: "border-orange-200 dark:border-orange-800/30",
    badgeText: "text-orange-600 dark:text-orange-400",
    linkBg: "bg-orange-50 hover:bg-orange-100/80 dark:bg-orange-950/15 dark:hover:bg-orange-900/20",
    linkText: "text-orange-600 dark:text-orange-300",
  },
}

const BRANDS = [
  {
    key: "wpkartpro",
    name: "WPKartPro",
    tag: "Digital Products Marketplace",
    description: "Premium digital products, templates, plugins, themes & more for creators and businesses.",
    domain: "wpkartpro.com",
    website: "https://wpkartpro.com/",
  },
  {
    key: "codexbazaar",
    name: "CodexBazaar",
    tag: "Source Code & Templates",
    description: "Source codes, scripts, templates and developer resources for your next big project.",
    domain: "codexbazaar.com",
    website: "https://codexbazaar.com/",
  },
  {
    key: "wpmart99",
    name: "WPMart99",
    tag: "Ready Made Websites",
    description: "Affordable ready-made WordPress websites for every business and niche.",
    domain: "wpmart99.com",
    website: "https://wpmart99.com/",
  },
  {
    key: "wpkeyhub",
    name: "WPKeyHub",
    tag: "Licenses & Keys",
    description: "Genuine licenses & keys for premium themes, plugins and software.",
    domain: "wpkeyhub.com",
    website: "https://wpkeyhub.com/",
  },
  {
    key: "toolzypro",
    name: "ToolzyPro",
    tag: "Reseller Panel & Tools",
    description: "Reseller panel to sell digital products, tools, themes, plugins & SaaS solutions.",
    domain: "toolzypro.in",
    website: "https://toolzypro.in/",
  },
  {
    key: "wptemplateshub",
    name: "WPTemplatesHub",
    tag: "Premium WP Templates",
    description: "Premium & professional WordPress templates for businesses and agencies.",
    domain: "wptemplateshub.com",
    website: "https://wptemplateshub.com/",
  },
  {
    key: "appsclap",
    name: "AppsClap",
    tag: "AI Tools & Software",
    description: "Smart AI tools, software and automation solutions to grow your business.",
    domain: "appsclap.com",
    website: "https://appsclap.com/",
  },
  {
    key: "gpthememart",
    name: "GPThemeMart",
    tag: "GeneratePress Themes",
    description: "Beautiful & lightweight GeneratePress themes for fast and SEO-friendly websites.",
    domain: "gpthememart.com",
    website: "https://gpthememart.com/",
  },
  {
    key: "bizzprofile",
    name: "BizzProfile",
    tag: "Digital Business Profile",
    description: "Create professional digital business profiles & boost your online presence.",
    domain: "bizzprofile.com",
    website: "https://bizzprofile.com/",
  },
  {
    key: "rswebsoft",
    name: "RSWebSoft",
    tag: "Agency & Web Solutions",
    description: "Our main agency platform offering web development, design & digital solutions.",
    domain: "rswebsoft.in",
    website: "https://rswebsoft.in/",
  },
]

export default function BrandsSection() {
  return (
    <section id="brands" className="container-rs scroll-mt-32 py-12 md:py-16">
      {/* Centered Heading */}
      <div className="mb-10 text-center">
        <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.25em] text-brand-500">
          Our Brands
        </span>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-cloud-100 sm:text-3xl md:text-4xl">
          Our Brands, Our Pride
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-cloud-400">
          RSWebSoft is home to multiple powerful brands delivering innovative digital solutions, products &amp; services for businesses worldwide.
        </p>
        <div className="mx-auto mt-4 h-1 w-12 rounded bg-brand-500" />
      </div>

      {/* Grid of 10 Brand Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
        {BRANDS.map((brand, i) => {
          const meta = BRAND_METADATA[brand.key]
          const IconCmp = meta.icon

          return (
            <motion.div
              key={brand.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-200 hover:shadow-xl dark:border-white/5 dark:bg-ink-850 dark:hover:border-white/10 dark:hover:shadow-black/30"
            >
              {/* Logo Row */}
              <div className="mb-4 flex items-center gap-2">
                <span className={`${meta.iconColor} shrink-0`}>
                  <IconCmp size={26} strokeWidth={2.5} />
                </span>
                <span className="font-display text-lg font-extrabold tracking-tight text-slate-800 dark:text-cloud-100">
                  {meta.part1}
                  <span className={meta.part2Color}>{meta.part2}</span>
                </span>
              </div>

              {/* Tag/Badge */}
              <div className={`mb-3.5 rounded-full border px-3 py-0.5 text-[10px] font-bold tracking-wide uppercase ${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`}>
                {brand.tag}
              </div>

              {/* Description */}
              <p className="mb-5 text-[13px] leading-relaxed text-slate-500 dark:text-cloud-400">
                {brand.description}
              </p>

              {/* Full Width Pill Link */}
              <a
                href={brand.website}
                target="_blank"
                rel="noreferrer"
                className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-200 ${meta.linkBg} ${meta.linkText}`}
              >
                {brand.domain}
                <ExternalLink size={13} strokeWidth={2.5} className="opacity-85" />
              </a>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom Success Banner */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 flex flex-col items-center gap-5 rounded-2xl border border-blue-100/50 bg-blue-50/20 bg-brand-gradient-soft p-5 dark:border-white/5 dark:bg-transparent sm:flex-row sm:justify-between sm:gap-6 sm:p-6"
      >
        <div className="flex items-center gap-4 text-left">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-md">
            <Rocket size={22} strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-cloud-100 sm:text-base">
              Building Digital Brands That Drive Success
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-cloud-300">
              From digital products to powerful tools &amp; services — our brands are built to empower businesses, creators &amp; entrepreneurs.
            </p>
          </div>
        </div>

        <Link
          to="/brands"
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-95 hover:shadow-lg"
        >
          Explore All Brands
          <ArrowRight size={16} strokeWidth={2.5} className="transition group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </section>
  )
}
