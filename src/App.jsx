import { Routes, Route } from "react-router-dom"
import SiteHeader from "./components/layout/SiteHeader"
import Footer from "./components/layout/Footer"
import Home from "./pages/Home"
import Placeholder from "./pages/Placeholder"

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Placeholder title="Products" />} />
          <Route path="/categories" element={<Placeholder title="Categories" />} />
          <Route path="/brands" element={<Placeholder title="Brands" />} />
          <Route path="/demos" element={<Placeholder title="Demo Center" />} />
          <Route path="/resources" element={<Placeholder title="Resources" />} />
          <Route path="/support" element={<Placeholder title="Support" />} />
          <Route path="*" element={<Placeholder title="Page Not Found" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
