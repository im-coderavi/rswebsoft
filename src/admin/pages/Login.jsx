import { useState } from "react"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../../context/AuthContext"
import { apiErrorMessage } from "../../lib/api"
import Logo from "../../components/ui/Logo"

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user?.role === "admin") {
    return <Navigate to={location.state?.from || "/admin"} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const loggedIn = await login(email, password)
      if (loggedIn.role !== "admin") throw new Error("This account does not have admin access")
      toast.success("Welcome back!")
      navigate("/admin", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-ink-850 p-7">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-1 text-center font-display text-xl font-bold text-cloud-100">
          Admin Login
        </h1>
        <p className="mb-6 text-center text-sm text-cloud-400">
          Sign in to manage products, categories and orders.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              placeholder="admin@rswebsoft.com"
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
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <LogIn size={16} /> {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
