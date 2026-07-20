import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { UploadCloud, X, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { api, apiErrorMessage } from "../../lib/api"

async function uploadFile(file, folder) {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("folder", folder)
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export default function ImageUploader({ images, onChange, max = 6, folder = "products" }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const mutation = useMutation({
    mutationFn: (file) => uploadFile(file, folder),
    onSuccess: (image) => onChange([...images, image]),
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, max - images.length)
    files.forEach((file) => mutation.mutate(file))
  }

  function removeAt(index) {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
          dragOver ? "border-brand-500 bg-brand-500/5" : "border-white/12 hover:border-white/25",
        ].join(" ")}
      >
        {mutation.isPending ? (
          <Loader2 size={22} className="animate-spin text-brand-300" />
        ) : (
          <UploadCloud size={22} className="text-cloud-400" />
        )}
        <p className="text-sm text-cloud-300">Click or drag images here to upload</p>
        <p className="text-xs text-cloud-500">PNG/JPG up to 5MB · {images.length}/{max}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.publicId} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
