import { forwardRef } from "react"
import { motion } from "framer-motion"

// Fades + slides an element up into place the first time it scrolls into
// view. `once` so nothing re-triggers annoyingly on scroll-up.
const Reveal = forwardRef(function Reveal(
  { children, delay = 0, y = 24, duration = 0.55, className, as = "div", ...rest },
  ref
) {
  const Component = motion[as] || motion.div
  return (
    <Component
      ref={ref}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  )
})

export default Reveal

// Wraps a list of children, staggering each one's reveal by `stagger` seconds.
export const RevealGroup = forwardRef(function RevealGroup(
  { children, stagger = 0.08, className, ...rest },
  ref
) {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ staggerChildren: stagger }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
})

export const revealItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] } },
}

export const RevealItem = forwardRef(function RevealItem({ children, className, as = "div", ...rest }, ref) {
  const Component = motion[as] || motion.div
  return (
    <Component ref={ref} variants={revealItemVariants} className={className} {...rest}>
      {children}
    </Component>
  )
})
