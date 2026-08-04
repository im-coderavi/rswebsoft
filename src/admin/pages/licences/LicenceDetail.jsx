import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { useLicence } from "../../../hooks/useLicences"

function Stat({ label, value, tone = "text-cloud-100" }) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-850 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cloud-500">
        {label}
      </div>
      <div className={`mt-1.5 font-display text-xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  )
}

export default function LicenceDetail() {
  const { id } = useParams()
  const { data: licence, isLoading } = useLicence(id)

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-ink-850" />
  }

  if (!licence) {
    return <p className="text-sm text-cloud-500">Licence not found.</p>
  }

  const distinctIps = licence.distinctIps?.length ?? 0
  const log = licence.accessLog ?? []

  return (
    <div>
      <Link
        to="/admin/licences"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-cloud-400 transition hover:text-cloud-100"
      >
        <ArrowLeft size={15} /> All licences
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-mono text-xl font-bold tracking-wide text-cloud-100">{licence.key}</h1>
          <p className="mt-1 text-sm text-cloud-400">{licence.productName}</p>
          {licence.user && (
            <p className="mt-1 text-sm text-cloud-500">
              {licence.user.name} · {licence.user.email}
              {licence.user.phone && ` · ${licence.user.phone}`}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            licence.status === "revoked"
              ? "bg-rose-500/15 text-status-bad"
              : "bg-emerald-500/15 text-status-ok"
          }`}
        >
          {licence.status}
        </span>
      </div>

      {licence.status === "revoked" && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-status-bad/25 bg-status-bad/5 p-4">
          <ShieldAlert size={16} className="mt-0.5 shrink-0 text-status-bad" />
          <div className="text-sm text-cloud-300">
            Revoked{" "}
            {licence.revokedAt &&
              new Date(licence.revokedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            {licence.revokedReason && ` — ${licence.revokedReason}`}
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Times opened" value={licence.accessCount ?? 0} />
        <Stat
          label="Distinct devices"
          value={distinctIps}
          tone={distinctIps >= 5 ? "text-status-warn" : "text-cloud-100"}
        />
        <Stat
          label="First issued"
          value={new Date(licence.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        />
        <Stat
          label="Last opened"
          value={
            licence.lastAccessAt
              ? new Date(licence.lastAccessAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : "never"
          }
        />
      </div>

      {distinctIps >= 5 && (
        <p className="mb-5 rounded-xl border border-status-warn/25 bg-status-warn/5 p-4 text-sm text-cloud-300">
          Opened from {distinctIps} different addresses. That <em>can</em> mean the key is being
          shared — but it can also just be a customer on mobile data, which rotates addresses
          constantly. Check whether the times and devices below look like one person before you
          revoke.
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-850">
        <div className="border-b border-ink-800 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-cloud-100">Access log</h2>
          <p className="mt-0.5 text-xs text-cloud-500">Most recent first, last 50 opens.</p>
        </div>

        {log.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-cloud-500">
            Never opened. The customer hasn't downloaded this yet.
          </p>
        ) : (
          <ul className="divide-y divide-ink-800">
            {log.map((entry, i) => (
              <li key={i} className="grid gap-1 px-5 py-3 sm:grid-cols-[11rem_9rem_minmax(0,1fr)] sm:gap-4">
                <span className="text-xs text-cloud-300 tabular-nums">
                  {new Date(entry.at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-mono text-xs text-cloud-400">{entry.ip}</span>
                <span className="truncate text-xs text-cloud-500" title={entry.userAgent}>
                  {entry.userAgent || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
