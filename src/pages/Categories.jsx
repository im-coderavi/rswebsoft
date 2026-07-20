import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Icon from "../components/ui/Icon"
import { toneGradient } from "../lib/tones"
import { useCategories } from "../hooks/useCategories"

export default function Categories() {
  const { data: categories, isLoading } = useCategories()

  return (
    <div className="container-rs py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cloud-100 sm:text-3xl">
          All Categories
        </h1>
        <p className="mt-2 text-sm text-cloud-400">
          Browse products by category — find exactly what you need for your project.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-ink-850" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {(categories || []).map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <Link
                to={`/products?category=${cat._id}`}
                className="group flex flex-col items-center rounded-2xl border border-white/8 bg-ink-850 p-5 text-center transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-black/30 sm:p-6"
              >
                <span
                  className="mb-4 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg transition group-hover:scale-110"
                  style={toneGradient(cat.tone)}
                >
                  <Icon name={cat.icon} size={26} />
                </span>
                <span className="text-sm font-bold text-cloud-100 sm:text-base">{cat.name}</span>
                <span className="mt-1 text-xs text-cloud-400">{cat.productCount} Products</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-400 opacity-0 transition group-hover:opacity-100">
                  Browse <ArrowRight size={12} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && (!categories || categories.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-300">
            <Icon name="FolderOpen" size={30} />
          </span>
          <p className="text-cloud-400">No categories found yet.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white"
          >
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  )
}
