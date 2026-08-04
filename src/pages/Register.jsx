import { useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { UserPlus } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

const EMPTY = { name: "", email: "", phone: "", password: "" }

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  // Mirrors the server's rules so the customer is told what's wrong before a
  // round trip. The server still validates — this is convenience, not trust.
  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = "Enter your name"
    if (!form.email.trim()) next.email = "Enter your email"
    const digits = form.phone.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "")
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      next.phone = "Enter a valid 10-digit mobile number"
    }
    if (form.password.length < 6) next.password = "At least 6 characters"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await register(form)
      toast.success("Account created — check your email for your user ID")
      navigate(location.state?.from || "/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="You'll need an account to buy — it also keeps your orders and downloads in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-300 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          label="Full name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          placeholder="Your name"
        />
        <AuthField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <AuthField
          label="Phone"
          type="tel"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
          hint="You can sign in with this later"
          placeholder="98765 43210"
        />
        <AuthField
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
          hint="At least 6 characters"
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <UserPlus size={16} /> {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-xs text-cloud-500">
          We'll email your user ID. We never send passwords by email.
        </p>
      </form>
    </AuthLayout>
  )
}
