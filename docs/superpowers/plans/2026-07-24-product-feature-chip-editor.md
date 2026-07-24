# Product Feature Chip Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ProductForm.jsx`'s newline-textarea Features field with an add/remove/reorder chip list, matching the manual-product-picker pattern in `HomeSectionList.jsx`.

**Architecture:** `form.features` changes type from a newline-joined string to a plain `string[]` in the existing `useState` form object. No backend changes — `Product.features` is already `[String]`.

**Tech Stack:** React 19, lucide-react icons, Tailwind v4 (existing tokens).

## Global Constraints

- This repo has no automated test framework — verification is `vite build` plus a manual browser check.
- No backend/model/route changes.
- No changes to any other `ProductForm` field or to `ProductDetail.jsx`.

---

### Task 1: Replace the Features textarea with a chip editor

**Files:**
- Modify: `src/admin/pages/products/ProductForm.jsx`

**Interfaces:**
- `form.features` type changes from `string` to `string[]` — affects the load effect (line ~96), `emptyForm` (line ~25), and `handleSubmit`'s payload (line ~147). No other file references `ProductForm`'s internal state, so this is fully self-contained.

- [ ] **Step 1: Add a `featureInput` local state and change `emptyForm.features` to an array**

Change:
```jsx
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
  features: "",
  demoUrl: "",
  downloadUrl: "",
  featured: false,
  status: "draft",
  images: [],
}
```
to:
```jsx
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
  demoUrl: "",
  downloadUrl: "",
  featured: false,
  status: "draft",
  images: [],
}
```

- [ ] **Step 2: Update the load-existing-product effect**

Change:
```jsx
      features: (existing.features || []).join("\n"),
```
to:
```jsx
      features: existing.features || [],
```

- [ ] **Step 3: Update `handleSubmit`'s payload**

Change:
```jsx
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features.split("\n").map((t) => t.trim()).filter(Boolean),
```
to:
```jsx
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      features: form.features,
```

- [ ] **Step 4: Add feature-list helper functions and local input state**

In the component body, right after `function setField(field, value) { ... }`, add:
```jsx
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
```

- [ ] **Step 5: Add the new icon imports**

Change:
```jsx
import { ArrowLeft, Save } from "lucide-react"
```
to:
```jsx
import { ArrowLeft, Save, Plus, X, ArrowUp, ArrowDown } from "lucide-react"
```

- [ ] **Step 6: Replace the Features textarea JSX**

Change:
```jsx
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
```
to:
```jsx
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
```

- [ ] **Step 7: Verify the build succeeds**

Run (from repo root):
```bash
npx vite build --mode development 2>&1 | tail -20
```
Expected: build completes with no errors.

- [ ] **Step 8: Manual verification**

With both dev servers running (`npm run server`, `npm run dev`), log into `/admin/products`:
1. Open an existing product's edit page — confirm its existing features (if any) render as rows, not an empty box.
2. Type a new feature and press Enter — confirm it's added as a row and the input clears.
3. Type another feature and click "Add" — confirm it's added too.
4. Use ▲/▼ to reorder two rows — confirm the order changes.
5. Click ✕ on a row — confirm it's removed.
6. Save the product — confirm no errors, then reload the edit page and confirm the saved features (in the reordered order) persist.
7. Open that product's public page (`/products/<slug>`) — confirm "Key Features Included" shows the same list in the same order.

- [ ] **Step 9: Commit**

```bash
git add src/admin/pages/products/ProductForm.jsx
git commit -m "feat: replace product features textarea with an add/remove/reorder chip editor"
```
