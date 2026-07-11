import { motion } from "framer-motion"
import SectionHeader from "../ui/SectionHeader"
import ProductCard from "./ProductCard"
import { useProducts } from "../../hooks/useProducts"

export default function ReadyWebsites() {
  const { data, isLoading } = useProducts({ type: "ready-website", status: "published", limit: 8 })
  const products = data?.items || []

  if (!isLoading && products.length === 0) return null

  return (
    <section className="container-rs py-8">
      <SectionHeader title="Ready Websites" to="/products?type=ready-website" />
      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading ready websites…</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
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
    </section>
  )
}
