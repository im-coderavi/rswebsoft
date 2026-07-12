import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Toaster } from "react-hot-toast"
import SiteHeader from "./SiteHeader"
import Footer from "./Footer"

export default function PublicLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
      <SiteHeader />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#14111f", color: "#f5f3fb", border: "1px solid rgba(255,255,255,0.08)" },
        }}
      />
    </div>
  )
}
