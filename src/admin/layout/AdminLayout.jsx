import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Toaster } from "react-hot-toast"
import AdminSidebar from "./AdminSidebar"
import AdminTopbar from "./AdminTopbar"

const TITLES = [
  { prefix: "/admin/products", title: "Products" },
  { prefix: "/admin/categories", title: "Categories" },
  { prefix: "/admin/brands", title: "Brands" },
  { prefix: "/admin/orders", title: "Orders" },
  { prefix: "/admin/settings", title: "Payment Settings" },
  { prefix: "/admin", title: "Dashboard" },
]

function titleFor(pathname) {
  return TITLES.find((t) => pathname.startsWith(t.prefix))?.title || "Admin"
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink-950 text-cloud-100">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar title={titleFor(pathname)} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ style: { background: "#14111f", color: "#f5f3fb", border: "1px solid rgba(255,255,255,0.08)" } }} />
    </div>
  )
}
