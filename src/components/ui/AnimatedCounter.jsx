import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useSpring } from "framer-motion"

// Parses stat strings like "1500+", "99.9%", "12+", "24/7" — animates the
// numeric lead-in (if any) counting up from 0, keeps the rest as a static suffix.
function parseValue(raw) {
  const match = String(raw).match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return { number: null, suffix: raw }
  return { number: Number(match[1]), suffix: match[2], decimals: match[1].includes(".") ? 1 : 0 }
}

export default function AnimatedCounter({ value, className }) {
  const { number, suffix, decimals } = parseValue(value)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration: 1.4, bounce: 0 })

  useEffect(() => {
    if (inView && number != null) motionValue.set(number)
  }, [inView, number, motionValue])

  useEffect(() => {
    if (number == null) return
    return spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${v.toFixed(decimals)}${suffix}`
      }
    })
  }, [spring, suffix, decimals, number])

  if (number == null) {
    return <span className={className}>{value}</span>
  }

  return (
    <motion.span ref={ref} className={className}>
      0{suffix}
    </motion.span>
  )
}
