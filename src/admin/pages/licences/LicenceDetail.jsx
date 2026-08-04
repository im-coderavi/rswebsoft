import { Link, useParams } from "react-router-dom"
import { ArrowLeft, ShieldAlert, Check, X, Clock, Monitor } from "lucide-react"
import toast from "react-hot-toast"
import { useLicence, useSetDeviceStatus } from "../../../hooks/useLicences"
import { apiErrorMessage } from "../../../lib/api"

const DEVICE_TONE = {
  approved: "text-status-ok",
  pending: "text-status-warn",
  denied: "text-status-bad",
}

function DeviceRow({ licenceId, device }) {
  const setStatus = useSetDeviceStatus()

  async function decide(status) {
    try {
      await setStatus.mutateAsync({ id: licenceId, deviceId: device.deviceId, status })
      toast.success(status === "approved" ? "Device approved" : "Device blocked")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-cloud-200">
          <Monitor size={14} className="shrink-0 text-cloud-500" />
          {device.label || "Unknown device"}
          <span className={`text-xs font-medium capitalize ${DEVICE_TONE[device.status]}`}>
            · {device.status}
          </span>
        </div>
        <div className="mt-1 font-mono text-xs text-cloud-500">
          {device.ip} · first seen{" "}
          {new Date(device.firstSeenAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        {device.status !== "approved" && (
          <button
            onClick={() => decide("approved")}
            disabled={setStatus.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-status-ok transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <Check size={13} /> Allow
          </button>
        )}
        {device.status !== "denied" && (
          <button
            onClick={() => decide("denied")}
            disabled={setStatus.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-status-bad transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            <X size={13} /> Block
          </button>
        )}
      </div>
    </li>
  )
}

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
  const devices = licence.devices ?? []
  const pendingDevices = devices.filter((d) => d.status === "pending").length

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

      <section className="mb-5 overflow-hidden rounded-2xl border border-ink-800 bg-ink-850">
        <div className="border-b border-ink-800 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-cloud-100">
            Devices
            {pendingDevices > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-status-warn">
                <Clock size={11} /> {pendingDevices} waiting
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-cloud-500">
            The first two machines are allowed automatically. Anything after that waits here until
            you decide — blocking one stops it opening the file without touching the rest.
          </p>
        </div>

        {devices.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-cloud-500">
            No device has used this licence yet.
          </p>
        ) : (
          <ul className="divide-y divide-ink-800">
            {devices.map((d) => (
              <DeviceRow key={d.deviceId} licenceId={licence._id} device={d} />
            ))}
          </ul>
        )}
      </section>

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
