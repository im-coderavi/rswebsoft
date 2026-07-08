import SectionHeader from "../ui/SectionHeader"
import ProductCard from "./ProductCard"
import { useProducts } from "../../hooks/useProducts"

export default function ReadyWebsites() {
  const { data, isLoading } = useProducts({ type: "ready-website", status: "published", limit: 6 })
  const products = data?.items || []

  if (!isLoading && products.length === 0) return null

  return (
    <section className="container-rs py-8">
      <SectionHeader title="Ready Websites" to="/products?type=ready-website" />
      {isLoading ? (
        <p className="text-sm text-cloud-500">Loading ready websites…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
