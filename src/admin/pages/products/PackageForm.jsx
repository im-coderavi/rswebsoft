import { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, Save, Plus, X, ArrowUp, ArrowDown } from "lucide-react"
import toast from "react-hot-toast"
import { useCategories } from "../../../hooks/useCategories"
import { useProduct, useCreateProduct, useUpdateProduct } from "../../../hooks/useProducts"
import { apiErrorMessage } from "../../../lib/api"
import ImageUploader from "../../components/ImageUploader"

const emptyForm = {
  name: "",
  shortDescription: "",
  description: "",
  price: "",
  salePrice: "",
  category: "",
  type: "package",
  tags: "",
  features: [],
  demoUrl: "",
  status: "draft",
  images: [],
}

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

export default function PackageForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const { data: categories } = useCategories()
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
      category: existing.category?._id || "",
      type: "package",
      tags: (existing.tags || []).join(", "),
      features: existing.features || [],
      demoUrl: existing.demoUrl || "",
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

  function cleanField(field) {
    setForm((f) => ({ ...f, [field]: stripHtmlToText(f[field]) }))
  }

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
      description: form.description,
      price: Number(form.price),
      salePrice: form.salePrice === "" ? undefined : Number(form.salePrice),
      category: form.category,
      type: "package",
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features,
      demoUrl: form.demoUrl,
      status: form.status,
      images: form.images,
    }

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, ...payload })
        toast.success("Package updated")
      } else {
        await createProduct.mutateAsync(payload)
        toast.success("Package created")
      }
      navigate("/admin/packages")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const saving = createProduct.isPending || updateProduct.isPending

  if (isEdit && loadingExisting) {
    return <p className="text-cloud-400">Loading package…</p>
  }

  return (
    <div className="w-full">
      <Link to="/admin/packages" className="mb-4 inline-flex items-center gap-1.5 text-sm text-cloud-400 hover:text-cloud-100">
        <ArrowLeft size={15} /> Back to packages
      </Link>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/8 bg-ink-850 p-8">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Package Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="e.g. Custom Plan (Pro)"
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
            placeholder="One-line summary shown on cards"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium text-cloud-400">Full Description</label>
            <button
              type="button"
              onClick={() => cleanField("description")}
              className="text-xs font-medium text-brand-300 hover:underline"
            >
              Clean formatting
            </button>
          </div>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            onPaste={handleDescriptionPaste("description")}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="Full package description"
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
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setField("tags", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="e.g. most popular, offer price"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">
            Features <span className="text-cloud-500">(shown as a checklist on the pricing card)</span>
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
              placeholder="e.g. Free domain for 1 year"
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
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">WhatsApp Link</label>
          <input
            value={form.demoUrl}
            onChange={(e) => setField("demoUrl", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 focus:border-brand-500/60 focus:outline-none"
            placeholder="https://wa.me/919876543210?text=I%20am%20interested%20in%20Custom%20Plan"
          />
          <p className="mt-1.5 text-xs text-cloud-500">Format: https://wa.me/YOUR_PHONE_NUMBER?text=MESSAGE</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-cloud-400">Images</label>
          <ImageUploader images={form.images} onChange={(images) => setField("images", images)} />
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

        <div className="flex justify-end gap-3 border-t border-white/8 pt-5">
          <Link
            to="/admin/packages"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-cloud-300 transition hover:bg-white/5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Package"}
          </button>
        </div>
      </form>
    </div>
  )
}
