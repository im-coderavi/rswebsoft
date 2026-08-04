import { useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(identifier, password)
      toast.success("Welcome back!")
      navigate(location.state?.from || "/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your email, phone number or user ID."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-brand-300 hover:underline">
            Create an account
          </Link>
        </>
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
        <div>
          <AuthField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-brand-300 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <LogIn size={16} /> {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  )
}
