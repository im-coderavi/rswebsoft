import { useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { UserPlus } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setSubmitting(true)
    try {
      await register(name, email, password)
      toast.success("Account created!")
      navigate(location.state?.from || "/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container-rs flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-ink-850 p-7">
        <h1 className="mb-1 text-center font-display text-xl font-bold text-cloud-100">Create Account</h1>
        <p className="mb-6 text-center text-sm text-cloud-400">Register to check out and track your orders.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Full Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <UserPlus size={16} /> {submitting ? "Creating…" : "Create Account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-cloud-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-300 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </section>
  )
}
