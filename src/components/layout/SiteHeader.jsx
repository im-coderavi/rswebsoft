import { useState } from "react"
import AnnouncementBar from "./AnnouncementBar"
import Header from "./Header"
import Navbar from "./Navbar"
import MobileMenu from "./MobileMenu"

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md">
        <AnnouncementBar />
        <Header onMenuClick={() => setMobileOpen(true)} />
        <div className="hidden lg:block">
          <Navbar />
        </div>
      </header>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
