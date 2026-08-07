import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { UserPlus, ArrowLeft, MailCheck, ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

const EMPTY = { name: "", email: "", phone: "", password: "" }
const RESEND_COOLDOWN_SECONDS = 60

function DetailsStep({ form, errors, submitting, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthField
        label="Full name"
        required
        autoComplete="name"
        value={form.name}
        onChange={(e) => onChange("name", e.target.value)}
        error={errors.name}
        placeholder="Your name"
      />
      <AuthField
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={form.email}
        onChange={(e) => onChange("email", e.target.value)}
        error={errors.email}
        hint="We'll send a code here to confirm it's yours"
        placeholder="you@example.com"
      />
      <AuthField
        label="Phone"
        type="tel"
        required
        autoComplete="tel"
        value={form.phone}
        onChange={(e) => onChange("phone", e.target.value)}
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
        onChange={(e) => onChange("password", e.target.value)}
        error={errors.password}
        hint="At least 6 characters"
        placeholder="••••••••"
      />
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
      >
        <UserPlus size={16} /> {submitting ? "Sending code…" : "Continue"}
      </button>
      <p className="text-center text-xs text-cloud-500">
        Your account is created once you enter the code — nothing is saved before that.
      </p>
    </form>
  )
}

function CodeStep({ email, onVerified, onBack, verifySignup, resendSignupOtp }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Matches the server's own resend cooldown, so the button isn't offering
  // something that would just come back as an error.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function submit(e) {
    e?.preventDefault()
    if (code.length !== 6) {
      setError("Enter all six digits")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      await verifySignup(email, code)
      onVerified()
    } catch (err) {
      setError(apiErrorMessage(err))
      setCode("")
      inputRef.current?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    try {
      const result = await resendSignupOtp(email)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setError("")
      toast.success(result.message)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-status-ok/25 bg-status-ok/5 p-3.5">
        <MailCheck size={16} className="mt-0.5 shrink-0 text-status-ok" />
        <p className="text-sm text-cloud-300">
          Code sent to <span className="font-medium text-cloud-100">{email}</span>. It expires in 10
          minutes.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="signup-code" className="mb-1.5 block text-xs font-medium text-cloud-400">
            6-digit code
          </label>
          <input
            id="signup-code"
            ref={inputRef}
            value={code}
            onChange={(e) => {
              // Digits only, capped at six — pasting "123 456" or a whole
              // sentence from the email still lands correctly.
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              setError("")
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            aria-invalid={error ? "true" : undefined}
            className={`w-full rounded-lg border bg-ink-800 px-3.5 py-3 text-center font-mono text-2xl tracking-[0.5em] text-cloud-100 placeholder:tracking-[0.5em] placeholder:text-cloud-500 focus:outline-none ${
              error ? "border-status-bad" : "border-ink-700 focus:border-brand-500"
            }`}
          />
          {error && <p className="mt-1.5 text-xs text-status-bad">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-40"
        >
          <ShieldCheck size={16} /> {submitting ? "Checking…" : "Verify and create account"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-cloud-400 transition hover:text-cloud-200"
        >
          <ArrowLeft size={14} /> Change details
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-medium text-brand-300 transition hover:underline disabled:text-cloud-500 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  )
}

export default function Register() {
  const { user, loading, startSignup, resendSignupOtp, verifySignup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [pendingEmail, setPendingEmail] = useState(null)

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

  async function handleStart(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const result = await startSignup(form)
      setPendingEmail(result.email)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  function handleVerified() {
    toast.success("Account created — check your email for your user ID")
    navigate(location.state?.from || "/", { replace: true })
  }

  return (
    <AuthLayout
      title={pendingEmail ? "Check your email" : "Create your account"}
      subtitle={
        pendingEmail
          ? "Enter the code we just sent to finish signing up."
          : "You'll need an account to buy — it also keeps your orders and downloads in one place."
      }
      footer={
        pendingEmail ? null : (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-brand-300 hover:underline">
              Sign in
            </Link>
          </>
        )
      }
    >
      {pendingEmail ? (
        <CodeStep
          email={pendingEmail}
          onVerified={handleVerified}
          onBack={() => setPendingEmail(null)}
          verifySignup={verifySignup}
          resendSignupOtp={resendSignupOtp}
        />
      ) : (
        <DetailsStep
          form={form}
          errors={errors}
          submitting={submitting}
          onChange={set}
          onSubmit={handleStart}
        />
      )}
    </AuthLayout>
  )
}
