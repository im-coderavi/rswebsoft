import { useState } from "react"
import { Link } from "react-router-dom"
import { Download, Copy, Check, ExternalLink, ShieldAlert, ArrowRight, KeyRound } from "lucide-react"
import toast from "react-hot-toast"
import { useMyLicences, useRevealLicence } from "../../hooks/useLicences"
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

function RevealedFile({ reveal }) {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-ink-700 bg-ink-800/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cloud-500">
            Download link
          </div>
          <a
            href={reveal.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1.5 break-all text-sm font-medium text-brand-300 hover:underline"
          >
            {reveal.downloadUrl} <ExternalLink size={13} className="shrink-0" />
          </a>
        </div>
        <CopyButton value={reveal.downloadUrl} label="Copy link" />
      </div>

      {reveal.downloadPassword && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-700 pt-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cloud-500">
              Password
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-cloud-100">
              {reveal.downloadPassword}
            </div>
          </div>
          <CopyButton value={reveal.downloadPassword} label="Copy password" />
        </div>
      )}
    </div>
  )
}

function LicenceCard({ licence }) {
  const reveal = useRevealLicence()
  const [revealed, setRevealed] = useState(null)
  const isRevoked = licence.status === "revoked"

  async function handleReveal() {
    try {
      setRevealed(await reveal.mutateAsync(licence.key))
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-850 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-base font-bold text-cloud-100">
            {licence.productName}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cloud-500">
            <KeyRound size={12} />
            <span className="font-mono tracking-wide text-cloud-300">{licence.key}</span>
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
        <CopyButton value={licence.key} label="Copy key" />
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
              and quote the key above.
            </p>
          </div>
        </div>
      ) : revealed ? (
        <RevealedFile reveal={revealed} />
      ) : (
        <button
          type="button"
          onClick={handleReveal}
          disabled={reveal.isPending}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          <Download size={15} /> {reveal.isPending ? "Opening…" : "Show download"}
        </button>
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
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-ink-850" />
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
        These files are registered to your account and every download is logged. Sharing a licence
        key or its password can get it revoked.
      </p>
      {licences.map((licence) => (
        <LicenceCard key={licence.id} licence={licence} />
      ))}
    </div>
  )
}
