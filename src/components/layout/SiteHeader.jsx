import AnnouncementBar from "./AnnouncementBar"
import Header from "./Header"
import Navbar from "./Navbar"

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md">
      <AnnouncementBar />
      <Header />
      <Navbar />
    </header>
  )
}
