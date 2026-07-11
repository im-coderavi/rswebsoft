import { Flame } from "lucide-react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import ProductCard from "./ProductCard"
import { useProducts } from "../../hooks/useProducts"
import Reveal from "../ui/Reveal"

export default function FeaturedProducts() {
  const { data, isLoading } = useProducts({ featured: true, status: "published", limit: 8 })
  const products = data?.items || []

  if (!isLoading && products.length === 0) return null

  return (
    <section className="container-rs py-8">
      <Reveal className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-brand-gradient-soft p-4 sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
              <Flame size={20} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-cloud-100">
                Featured Products
              </h2>
              <p className="mt-0.5 text-sm text-cloud-400">Hand-picked, top-rated across every category</p>
            </div>
          </div>
          <Link to="/products?featured=true" className="text-sm font-medium text-brand-300 hover:text-brand-200">
            View All →
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-cloud-500">Loading featured products…</p>
        ) : (
          <div className="relative grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4">
            {products.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  )
}
