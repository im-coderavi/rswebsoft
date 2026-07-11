import { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, Save } from "lucide-react"
import toast from "react-hot-toast"
import { useCategories } from "../../../hooks/useCategories"
import { useBrands } from "../../../hooks/useBrands"
import { useProduct, useCreateProduct, useUpdateProduct } from "../../../hooks/useProducts"
import { apiErrorMessage } from "../../../lib/api"
import ImageUploader from "../../components/ImageUploader"

const TYPES = ["plugin", "theme", "ready-website", "saas", "source-code", "other"]

const emptyForm = {
  name: "",
  shortDescription: "",
  description: "",
  price: "",
  salePrice: "",
  saleEndsAt: "",
  category: "",
  brand: "",
  type: "plugin",
  tags: "",
  features: "",
  demoUrl: "",
  featured: false,
  status: "draft",
  images: [],
}

// datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone/seconds
function toDateTimeLocal(value) {
  if (!value) return ""
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { data: existing, isLoading: loadingExisting } = useProduct(id)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!existing) return
    setForm({
      name: existing.name || "",
      shortDescription: existing.shortDescription || "",
      description: existing.description || "",
      price: existing.price ?? "",
      salePrice: existing.salePrice ?? "",
      saleEndsAt: toDateTimeLocal(existing.saleEndsAt),
      category: existing.category?._id || "",
      brand: existing.brand?._id || "",
      type: existing.type || "plugin",
      tags: (existing.tags || []).join(", "),
      features: (existing.features || []).join("\n"),
      demoUrl: existing.demoUrl || "",
      featured: Boolean(existing.featured),
      status: existing.status || "draft",
      images: existing.images || [],
    })
  }, [existing])

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const payload = {
      name: form.name,
      shortDescription: form.shortDescription,
      description: form.description,
      price: Number(form.price),
      salePrice: form.salePrice === "" ? undefined : Number(form.salePrice),
      saleEndsAt: form.saleEndsAt || undefined,
      category: form.category,
      brand: form.brand || undefined,
      type: form.type,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features.split("\n").map((t) => t.trim()).filter(Boolean),
      demoUrl: form.demoUrl,
      featured: form.featured,
      status: form.status,
      images: form.images,
    }

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, ...payload })
        toast.success("Product updated")
      } else {
        await createProduct.mutateAsync(payload)
        toast.success("Product created")
      }
      navigate("/admin/products")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const saving = createProduct.isPending || updateProduct.isPending

  if (isEdit && loadingExisting) {
    return <p className="text-cloud-400">Loading product…</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-cloud-400 hover:text-cloud-100">
        <ArrowLeft size={15} /> Back to products
      </Link>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/8 bg-ink-850 p-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Product Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="e.g. Rank Math SEO Pro"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Short Description</label>
          <input
            value={form.shortDescription}
            onChange={(e) => setField("shortDescription", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="One-line summary shown on cards"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="Full product description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Price (₹)</label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Sale Price (₹, optional)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.salePrice}
              onChange={(e) => setField("salePrice", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            Sale Ends At <span className="text-cloud-500">(optional — shows a countdown timer on the product page)</span>
          </label>
          <input
            type="datetime-local"
            value={form.saleEndsAt}
            onChange={(e) => setField("saleEndsAt", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Category</label>
            <select
              required
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            >
              <option value="" disabled>Select a category</option>
              {categories?.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Brand (optional)</label>
            <select
              value={form.brand}
              onChange={(e) => setField("brand", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            >
              <option value="">No brand</option>
              {brands?.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Type</label>
            <select
              value={form.type}
              onChange={(e) => setField("type", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Status</label>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setField("tags", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="seo, wordpress, performance"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            Features <span className="text-cloud-500">(one per line — shown as a checklist)</span>
          </label>
          <textarea
            rows={4}
            value={form.features}
            onChange={(e) => setField("features", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder={"Lifetime updates\nPremium support included\nWorks with WooCommerce"}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Demo URL</label>
          <input
            value={form.demoUrl}
            onChange={(e) => setField("demoUrl", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="https://…"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Images</label>
          <ImageUploader images={form.images} onChange={(images) => setField("images", images)} />
        </div>

        <label className="flex items-center gap-2.5 text-sm text-cloud-300">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setField("featured", e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-ink-800 accent-brand-500"
          />
          Feature this product on the homepage
        </label>

        <div className="flex justify-end gap-3 border-t border-white/8 pt-5">
          <Link
            to="/admin/products"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  )
}
