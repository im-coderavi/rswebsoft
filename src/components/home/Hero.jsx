import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import DeviceMockup from "./DeviceMockup"

const easeOut = [0.21, 0.47, 0.32, 0.98]

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: easeOut },
  }),
}

function TypingText({ words, typingSpeed = 80, deletingSpeed = 40, delayBetweenWords = 2200 }) {
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !isDeleting) {
      const timeout = setTimeout(() => setIsDeleting(true), delayBetweenWords)
      return () => clearTimeout(timeout)
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false)
      setIndex((prev) => (prev + 1) % words.length)
      return
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1))
    }, isDeleting ? deletingSpeed : typingSpeed)

    return () => clearTimeout(timeout)
  }, [subIndex, isDeleting, index, words, typingSpeed, deletingSpeed, delayBetweenWords])

  useEffect(() => {
    const cursorBlink = setInterval(() => {
      setBlink((prev) => !prev)
    }, 500)
    return () => clearInterval(cursorBlink)
  }, [])

  return (
    <span className="text-gradient inline font-extrabold">
      {words[index].substring(0, subIndex)}
      <span className={`inline-block w-[2px] sm:w-[3px] ml-1 bg-accent-400 h-[0.85em] align-middle ${blink ? 'opacity-100' : 'opacity-0'}`} />
    </span>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* ambient glows — slow drifting pulse for a premium feel */}
      <motion.div
        className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-600/20 blur-[140px]"
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-0 top-24 h-[450px] w-[450px] rounded-full bg-accent-500/15 blur-[140px]"
        animate={{ opacity: [1, 0.7, 1], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="container-rs relative grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-12 lg:py-20">
        {/* copy */}
        <div className="lg:col-span-6">
          <motion.span
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-200"
          >
            <Sparkles size={13} /> 1500+ Premium Products
          </motion.span>
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-cloud-100 sm:text-5xl sm:leading-[1.08]"
          >
            Everything You Need to{" "}
            <span className="text-gradient">Build, Grow &amp; Automate</span>{" "}
            Your <TypingText words={["Digital Products", "WordPress Plugins", "Premium Themes", "SaaS Software", "Website Templates", "Digital Business"]} />
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-md text-[15px] leading-relaxed text-cloud-400"
          >
            Premium WordPress Plugins, Themes, SaaS Tools, Source Codes &amp;
            Developer Resources – All in One Place.
          </motion.p>
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow"
            >
              Browse All Products <ArrowRight size={17} />
            </Link>
            <a
              href="#brands"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-cloud-100 transition hover:bg-white/10"
            >
              Explore Our Brands
            </a>
          </motion.div>
        </div>

        {/* device */}
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: easeOut }}
        >
          <DeviceMockup />
        </motion.div>
      </div>
    </section>
  )
}
