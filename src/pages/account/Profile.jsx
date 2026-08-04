import { useState } from "react"
import { Check, Copy, KeyRound, Save } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../../context/AuthContext"
import { apiErrorMessage } from "../../lib/api"
import AuthField from "../../components/auth/AuthField"

function Card({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-ink-800 bg-ink-850 p-6">
      <h2 className="font-display text-base font-bold text-cloud-100">{title}</h2>
      {description && <p className="mt-1 text-sm text-cloud-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function UserIdRow({ userId }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be blocked (insecure origin, denied permission).
      // The ID is on screen either way, so just say so rather than failing.
      toast.error("Couldn't copy — select the ID and copy it manually")
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-800/50 px-4 py-3.5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cloud-500">
          Your user ID
        </div>
        <div className="mt-1 font-mono text-lg font-bold tracking-wide text-cloud-100">{userId}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-medium text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100"
      >
        {copied ? <Check size={13} className="text-status-ok" /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}

function DetailsForm({ user, updateProfile }) {
  const [form, setForm] = useState({ name: user.name ?? "", phone: user.phone ?? "" })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const dirty = form.name !== (user.name ?? "") || form.phone !== (user.phone ?? "")

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const next = {}
    if (!form.name.trim()) next.name = "Enter your name"
    const digits = form.phone.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "")
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      next.phone = "Enter a valid 10-digit mobile number"
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await updateProfile(form)
      toast.success("Profile updated")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField
        label="Full name"
        autoComplete="name"
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        error={errors.name}
      />
      <AuthField
        label="Phone"
        type="tel"
        autoComplete="tel"
        value={form.phone}
        onChange={(e) => set("phone", e.target.value)}
        error={errors.phone}
        hint="You can sign in with this"
      />
      <div>
        <label className="mb-1.5 block text-xs font-medium text-cloud-400">Email</label>
        <input
          value={user.email ?? ""}
          readOnly
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-ink-800 bg-ink-900 px-3.5 py-2.5 text-sm text-cloud-500"
        />
        <p className="mt-1.5 text-xs text-cloud-500">
          Your email is how we get you back into your account, so it can't be changed here. Contact
          support if you need it moved.
        </p>
      </div>
      <button
        type="submit"
        disabled={saving || !dirty}
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-40"
      >
        <Save size={15} /> {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  )
}

const EMPTY_PASSWORDS = { currentPassword: "", password: "", confirm: "" }

function PasswordForm({ changePassword }) {
  const [form, setForm] = useState(EMPTY_PASSWORDS)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const next = {}
    if (!form.currentPassword) next.currentPassword = "Enter your current password"
    if (form.password.length < 6) next.password = "At least 6 characters"
    if (form.password !== form.confirm) next.confirm = "Passwords don't match"
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await changePassword(form.currentPassword, form.password)
      setForm(EMPTY_PASSWORDS)
      toast.success("Password changed — other devices have been signed out")
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthField
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={(e) => set("currentPassword", e.target.value)}
        error={errors.currentPassword}
      />
      <AuthField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        error={errors.password}
        hint="At least 6 characters"
      />
      <AuthField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={form.confirm}
        onChange={(e) => set("confirm", e.target.value)}
        error={errors.confirm}
      />
      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl border border-ink-700 px-5 py-2.5 text-sm font-semibold text-cloud-100 transition hover:bg-ink-800 disabled:opacity-40"
      >
        <KeyRound size={15} /> {saving ? "Updating…" : "Change password"}
      </button>
    </form>
  )
}

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-4">
      {user.userId && (
        <Card
          title="Account"
          description="Quote this ID when you contact support — it's the fastest way for us to find you."
        >
          <UserIdRow userId={user.userId} />
        </Card>
      )}

      <Card title="Your details" description="Used on your orders and invoices.">
        <DetailsForm user={user} updateProfile={updateProfile} />
      </Card>

      <Card
        title="Password"
        description="Changing it signs you out on every other device you've used."
      >
        <PasswordForm changePassword={changePassword} />
      </Card>
    </div>
  )
}
