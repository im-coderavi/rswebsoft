import { Outlet } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import SiteHeader from "./SiteHeader"
import Footer from "./Footer"

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
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
