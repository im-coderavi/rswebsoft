import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom"
import { ArrowLeft, Save, Plus, X, ArrowUp, ArrowDown } from "lucide-react"
import toast from "react-hot-toast"
import { useCategories } from "../../../hooks/useCategories"
import { useBrands } from "../../../hooks/useBrands"
import { useProduct, useCreateProduct, useUpdateProduct } from "../../../hooks/useProducts"
import { apiErrorMessage } from "../../../lib/api"
import ImageUploader from "../../components/ImageUploader"

const TYPES = ["plugin", "theme", "ready-website", "delivered-website", "package", "saas", "source-code", "tool", "other"]

const emptyForm = {
  name: "",
  shortDescription: "",
  displayTag: "",
  description: "",
  price: "",
  salePrice: "",
  saleEndsAt: "",
  category: "",
  brand: "",
  type: "plugin",
  tags: "",
  features: [],
  packages: [],
  demoUrl: "",
  downloadUrl: "",
  featured: false,
  status: "draft",
  images: [],
}

// Descriptions are stored and shown as plain text (see ProductDetail.jsx) —
// this turns HTML someone pasted in (e.g. copied from a rendered web page)
// back into readable plain text instead of leaving raw tags in the field.
function stripHtmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function looksLikeHtml(text) {
  return /<[a-z][\s\S]*>/i.test(text)
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
  const [searchParams] = useSearchParams()

  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { data: existing, isLoading: loadingExisting } = useProduct(id)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const [form, setForm] = useState(() => {
    const typeParam = searchParams.get("type")
    return typeParam && TYPES.includes(typeParam) ? { ...emptyForm, type: typeParam } : emptyForm
  })

  useEffect(() => {
    if (!existing) return
    setForm({
      name: existing.name || "",
      shortDescription: existing.shortDescription || "",
      displayTag: existing.displayTag || "",
      description: existing.description || "",
      price: existing.price ?? "",
      salePrice: existing.salePrice ?? "",
      saleEndsAt: toDateTimeLocal(existing.saleEndsAt),
      category: existing.category?._id || "",
      brand: existing.brand?._id || "",
      type: existing.type || "plugin",
      tags: (existing.tags || []).join(", "),
      features: existing.features || [],
      packages: existing.packages || [],
      demoUrl: existing.demoUrl || "",
      downloadUrl: existing.downloadUrl || "",
      featured: Boolean(existing.featured),
      status: existing.status || "draft",
      images: existing.images || [],
    })
  }, [existing])

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const [featureInput, setFeatureInput] = useState("")

  function addFeature() {
    const value = featureInput.trim()
    if (!value) return
    setForm((f) => ({ ...f, features: [...f.features, value] }))
    setFeatureInput("")
  }

  function removeFeature(index) {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }))
  }

  function moveFeature(index, direction) {
    setForm((f) => {
      const list = [...f.features]
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= list.length) return f
      ;[list[index], list[swapWith]] = [list[swapWith], list[index]]
      return { ...f, features: list }
    })
  }

  const [packageName, setPackageName] = useState("")
  const [packagePrice, setPackagePrice] = useState("")
  const [packageDescription, setPackageDescription] = useState("")

  function addPackage() {
    const name = packageName.trim()
    const price = Number(packagePrice)
    if (!name || !packagePrice || Number.isNaN(price) || price < 0) return
    setForm((f) => ({ ...f, packages: [...f.packages, { name, price, description: packageDescription.trim() }] }))
    setPackageName("")
    setPackagePrice("")
    setPackageDescription("")
  }

  function removePackage(index) {
    setForm((f) => ({ ...f, packages: f.packages.filter((_, i) => i !== index) }))
  }

  function movePackage(index, direction) {
    setForm((f) => {
      const list = [...f.packages]
      const swapWith = direction === "up" ? index - 1 : index + 1
      if (swapWith < 0 || swapWith >= list.length) return f
      ;[list[index], list[swapWith]] = [list[swapWith], list[index]]
      return { ...f, packages: list }
    })
  }

  function cleanField(field) {
    setForm((f) => ({ ...f, [field]: stripHtmlToText(f[field]) }))
  }

  // Only intercepts pastes that actually look like HTML — normal plain-text
  // pastes go through untouched.
  function handleDescriptionPaste(field) {
    return (e) => {
      const raw = e.clipboardData.getData("text/plain")
      if (!looksLikeHtml(raw)) return

      e.preventDefault()
      const cleaned = stripHtmlToText(raw)
      const el = e.target
      const start = el.selectionStart
      const end = el.selectionEnd
      setForm((f) => {
        const current = f[field]
        return { ...f, [field]: current.slice(0, start) + cleaned + current.slice(end) }
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const payload = {
      name: form.name,
      shortDescription: form.shortDescription,
      displayTag: form.displayTag,
      description: form.description,
      price: Number(form.price),
      salePrice: form.salePrice === "" ? undefined : Number(form.salePrice),
      saleEndsAt: form.saleEndsAt || undefined,
      category: form.category,
      brand: form.brand || undefined,
      type: form.type,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features,
      packages: form.packages,
      demoUrl: form.demoUrl,
      downloadUrl: form.downloadUrl,
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
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium text-cloud-400">Short Description</label>
            <button
              type="button"
              onClick={() => cleanField("shortDescription")}
              className="text-xs font-medium text-brand-300 hover:underline"
            >
              Clean formatting
            </button>
          </div>
          <input
            value={form.shortDescription}
            onChange={(e) => setField("shortDescription", e.target.value)}
            onPaste={handleDescriptionPaste("shortDescription")}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="One-line summary shown on cards — plain text only"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            Display Tag <span className="text-cloud-500">(small badge shown on the "Delivered Websites" homepage cards — e.g. "E-commerce")</span>
          </label>
          <input
            value={form.displayTag}
            onChange={(e) => setField("displayTag", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="e.g. E-commerce"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium text-cloud-400">
              Description <span className="text-cloud-500">(plain text — no HTML)</span>
            </label>
            <button
              type="button"
              onClick={() => cleanField("description")}
              className="text-xs font-medium text-brand-300 hover:underline"
            >
              Clean formatting
            </button>
          </div>
          <textarea
            rows={6}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            onPaste={handleDescriptionPaste("description")}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="Full product description — write it as plain paragraphs, blank line between paragraphs"
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
            Features <span className="text-cloud-500">(shown as a checklist on the product page)</span>
          </label>
          <div className="flex gap-2">
            <input
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addFeature()
                }
              }}
              placeholder="e.g. Lifetime updates"
              className="flex-1 rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={addFeature}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2.5 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
            >
              <Plus size={15} /> Add
            </button>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {form.features.map((feature, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-sm text-cloud-200">
                <span className="truncate">{feature}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveFeature(i, "up")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                    <ArrowUp size={13} />
                  </button>
                  <button type="button" onClick={() => moveFeature(i, "down")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                    <ArrowDown size={13} />
                  </button>
                  <button type="button" onClick={() => removeFeature(i)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
            {form.features.length === 0 && (
              <p className="text-xs text-cloud-500">No features added yet.</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            Packages <span className="text-cloud-500">(shown as an info section on the product page — doesn't affect Buy Now/Cart)</span>
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
            <input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Installation"
              className="rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
            <input
              type="number"
              min="0"
              value={packagePrice}
              onChange={(e) => setPackagePrice(e.target.value)}
              placeholder="Price"
              className="rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
            <input
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="Description (optional)"
              className="rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={addPackage}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2.5 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
            >
              <Plus size={15} /> Add
            </button>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {form.packages.map((pkg, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-ink-800 px-3 py-2 text-sm text-cloud-200">
                <div className="min-w-0 truncate">
                  <span className="font-semibold">{pkg.name}</span>
                  <span className="text-cloud-400"> — ₹{Number(pkg.price).toLocaleString("en-IN")}</span>
                  {pkg.description && <span className="text-cloud-500"> — {pkg.description}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => movePackage(i, "up")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                    <ArrowUp size={13} />
                  </button>
                  <button type="button" onClick={() => movePackage(i, "down")} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-white/5">
                    <ArrowDown size={13} />
                  </button>
                  <button type="button" onClick={() => removePackage(i)} className="grid h-6 w-6 place-items-center rounded text-cloud-400 hover:bg-rose-500/15 hover:text-rose-400">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
            {form.packages.length === 0 && (
              <p className="text-xs text-cloud-500">No packages added yet.</p>
            )}
          </div>
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
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            Download Link <span className="text-cloud-500">(given to the customer after purchase — Drive, Dropbox, or any link)</span>
          </label>
          <input
            value={form.downloadUrl}
            onChange={(e) => setField("downloadUrl", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="https://drive.google.com/…"
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
