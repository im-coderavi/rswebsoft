import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [identifier, setIdentifier] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await forgotPassword(identifier)
      // Always the same confirmation, whether or not the account exists —
      // anything else would let a visitor test which emails are registered.
      setSent(true)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If that account exists, a reset link is on its way. The link works once and expires in an hour."
        footer={
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand-300 hover:underline">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-cloud-400">
          Nothing after a few minutes? Check your spam folder, or{" "}
          <button onClick={() => setSent(false)} className="font-medium text-brand-300 hover:underline">
            try a different email
          </button>
          .
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email, phone or user ID and we'll send a reset link."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand-300 hover:underline">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email, phone or user ID"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <Mail size={16} /> {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  )
}
