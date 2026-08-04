import { useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { KeyRound } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

export default function ResetPassword() {
  const { token } = useParams()
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    const next = {}
    if (password.length < 6) next.password = "At least 6 characters"
    if (password !== confirm) next.confirm = "Passwords don't match"
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await resetPassword(token, password)
      toast.success("Password updated — you're signed in")
      navigate("/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose something you haven't used here before."
      footer={
        <>
          Link expired?{" "}
          <Link to="/forgot-password" className="font-medium text-brand-300 hover:underline">
            Request a new one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrors((s) => ({ ...s, password: undefined }))
          }}
          error={errors.password}
          hint="At least 6 characters"
          placeholder="••••••••"
        />
        <AuthField
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            setErrors((s) => ({ ...s, confirm: undefined }))
          }}
          error={errors.confirm}
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <KeyRound size={16} /> {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  )
}
