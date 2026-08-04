import { useState, useId } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function AuthField({ label, type = "text", hint, error, ...rest }) {
  const [revealed, setRevealed] = useState(false)
  const id = useId()
  const isPassword = type === "password"
  const inputType = isPassword && revealed ? "text" : type

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-cloud-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? "true" : undefined}
          className={`w-full rounded-lg border bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none ${
            error ? "border-status-bad" : "border-ink-700 focus:border-brand-500"
          } ${isPassword ? "pr-11" : ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-1 top-1/2 grid h-8 w-9 -translate-y-1/2 place-items-center rounded-md text-cloud-500 transition hover:text-cloud-300"
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-status-bad">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-cloud-500">{hint}</p>
      ) : null}
    </div>
  )
}
