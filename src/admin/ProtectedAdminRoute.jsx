import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedAdminRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950 text-cloud-400">
        Loading…
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
