import { useState } from "react"
import { Link } from "react-router-dom"
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Lock,
  LockOpen,
} from "lucide-react"
import toast from "react-hot-toast"
import { useMyLicences, useUnlockLicence, useOpenLicenceFile } from "../../hooks/useLicences"
import { apiErrorMessage } from "../../lib/api"

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy — select the text and copy it manually")
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-xs font-medium text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100"
    >
      {copied ? <Check size={13} className="text-status-ok" /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  )
}

function UnlockForm({ licence, onUnlocked }) {
  const unlock = useUnlockLicence()
  const [key, setKey] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    try {
      const result = await unlock.mutateAsync(key.trim())
      onUnlocked({ ...result, key: key.trim().toUpperCase() })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label className="mb-1.5 block text-xs font-medium text-cloud-400">
        Enter your licence key to unlock
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          value={key}
          onChange={(e) => {
            setKey(e.target.value)
            setError("")
          }}
          required
          autoComplete="off"
          spellCheck="false"
          placeholder={licence.maskedKey}
          aria-invalid={error ? "true" : undefined}
          className={`min-w-[13rem] flex-1 rounded-lg border bg-ink-800 px-3.5 py-2.5 font-mono text-sm uppercase tracking-wide text-cloud-100 placeholder:font-mono placeholder:tracking-wide placeholder:text-cloud-500 focus:outline-none ${
            error ? "border-status-bad" : "border-ink-700 focus:border-brand-500"
          }`}
        />
        <button
          type="submit"
          disabled={unlock.isPending}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          <LockOpen size={15} /> {unlock.isPending ? "Checking…" : "Unlock"}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-status-bad">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-cloud-500">
          The full key is in your delivery email. We only show the last part here.
        </p>
      )}
    </form>
  )
}

function UnlockedFile({ unlocked }) {
  const open = useOpenLicenceFile()

  async function handleOpen() {
    try {
      await open.mutateAsync(unlocked.key)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-status-ok/25 bg-status-ok/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-status-ok">
        <LockOpen size={15} /> Unlocked
      </div>

      <button
        type="button"
        onClick={handleOpen}
        disabled={open.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50 sm:w-auto"
      >
        <ExternalLink size={15} /> {open.isPending ? "Opening…" : "Open download"}
      </button>

      {unlocked.downloadPassword && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-status-ok/20 pt-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cloud-500">
              File password
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-cloud-100">
              {unlocked.downloadPassword}
            </div>
          </div>
          <CopyButton value={unlocked.downloadPassword} label="Copy password" />
        </div>
      )}

      <p className="text-xs text-cloud-500">
        The file opens in a new tab. There's no link to copy — each open goes through your licence
        and is logged against your account.
      </p>
    </div>
  )
}

function LicenceCard({ licence }) {
  const [unlocked, setUnlocked] = useState(null)
  const isRevoked = licence.status === "revoked"

  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-850 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-bold text-cloud-100">
            {licence.productName}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cloud-500">
            {unlocked ? <LockOpen size={12} /> : <Lock size={12} />}
            <span className="font-mono tracking-wide text-cloud-300">{licence.maskedKey}</span>
            {licence.accessCount > 0 && (
              <>
                <span className="text-cloud-500/40">·</span>
                <span>
                  opened {licence.accessCount} time{licence.accessCount === 1 ? "" : "s"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {isRevoked ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-status-bad/25 bg-status-bad/5 p-3.5">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-status-bad" />
          <div className="text-sm text-cloud-300">
            <p className="font-medium text-status-bad">This licence has been revoked.</p>
            <p className="mt-0.5 text-cloud-500">
              If you think that's a mistake,{" "}
              <Link to="/support" className="text-brand-300 hover:underline">
                contact support
              </Link>{" "}
              and quote the key from your email.
            </p>
          </div>
        </div>
      ) : unlocked ? (
        <UnlockedFile unlocked={unlocked} />
      ) : (
        <UnlockForm licence={licence} onUnlocked={setUnlocked} />
      )}
    </section>
  )
}

export default function Downloads() {
  const { data: licences, isLoading } = useMyLicences()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink-850" />
        ))}
      </div>
    )
  }

  if (!licences?.length) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-850 px-6 py-14 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink-800 text-cloud-500">
          <Download size={20} />
        </span>
        <h2 className="font-display text-base font-bold text-cloud-100">Nothing to download yet</h2>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-cloud-500">
          Once an order is delivered, its files show up here.
        </p>
        <Link
          to="/products"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          Browse products <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-cloud-500">
        Unlock a product with the licence key from its delivery email. Files are registered to your
        account and every open is logged — sharing a key can get it revoked.
      </p>
      {licences.map((licence) => (
        <LicenceCard key={licence.id} licence={licence} />
      ))}
    </div>
  )
}
