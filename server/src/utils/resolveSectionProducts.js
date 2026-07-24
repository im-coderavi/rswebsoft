import Product from "../models/Product.js"

export async function resolveSectionProducts(section) {
  if (section.selectionMode === "manual") {
    const ids = section.manualProducts || []
    if (ids.length === 0) return []

    const products = await Product.find({ _id: { $in: ids }, status: "published" })
      .populate("category", "name slug icon tone")
      .populate("brand", "name slug")

    const byId = new Map(products.map((p) => [String(p._id), p]))
    return ids
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .slice(0, section.maxItems)
  }

  const filter = { status: "published" }
  if (section.filters?.category) filter.category = section.filters.category
  if (section.filters?.type && section.filters.type !== "any") filter.type = section.filters.type
  if (section.filters?.onlyFeatured) filter.featured = true

  return Product.find(filter)
    .populate("category", "name slug icon tone")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 })
    .limit(section.maxItems)
}
