// Centralised mock content for the RSWebSoft home page.
// Icon names map to lucide-react components (resolved in the UI layer).

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products", dropdown: true },
  { label: "Categories", to: "/categories", dropdown: true },
  { label: "Brands", to: "/brands", dropdown: true },
  { label: "Demo Center", to: "/demos" },
  { label: "Resources", to: "/resources", dropdown: true },
  { label: "Support", to: "/support", dropdown: true },
]

export const heroStats = [
  { icon: "LayoutTemplate", value: "40+", label: "Templates" },
  { icon: "Boxes", value: "12+", label: "Brands" },
  { icon: "Users", value: "1000+", label: "Happy Customers" },
  { icon: "Activity", value: "99.9%", label: "Uptime" },
  { icon: "Clock", value: "24/7", label: "Customer Support" },
]

export const statStrip = [
  { icon: "Package", value: "1500+", label: "Products" },
  { icon: "Grid3x3", value: "40+", label: "Categories" },
  { icon: "Building2", value: "12+", label: "Sister Brands" },
  { icon: "Smile", value: "1000+", label: "Happy Customers" },
  { icon: "Activity", value: "99.9%", label: "Uptime" },
  { icon: "Headphones", value: "24/7", label: "Support" },
]

export const demoCenter = [
  { icon: "Monitor", title: "Frontend Demos", sub: "Live website preview" },
  { icon: "LayoutDashboard", title: "Admin Demos", sub: "Backend preview" },
  { icon: "PlayCircle", title: "Video Demos", sub: "Product Overview" },
  { icon: "Image", title: "Screenshots", sub: "Detailed Screens" },
  { icon: "FileText", title: "Documentation", sub: "Guides & Docs" },
  { icon: "Download", title: "Download Sample", sub: "Try before purchase" },
]

export const testimonials = [
  { name: "Rohit Sharma", role: "Web Developer", rating: 5, quote: "Best marketplace for WordPress products! High quality items and excellent support." },
  { name: "Priya Patel", role: "Agency Owner", rating: 5, quote: "I found everything for my client projects in one place. Highly recommended!" },
  { name: "Amit Verma", role: "Freelancer", rating: 5, quote: "Great collection of themes and plugins. Updates and support are on point." },
  { name: "Neha Singh", role: "Blogger", rating: 5, quote: "Love the ready websites. Saved me so much time and effort." },
]

export const footerColumns = [
  {
    title: "Products",
    links: ["All Products", "New Arrivals", "Best Sellers", "Featured Products", "Trending Products"],
  },
  {
    title: "Categories",
    links: ["WordPress Plugins", "WordPress Themes", "Ready Websites", "SaaS Software", "AI Tools", "View All Categories"],
  },
  {
    title: "Brands",
    links: ["WPKartPro", "ToolzyPro", "WPTemplatesHub", "CodexBazaar", "AppsClap", "BizzProfile"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Video Tutorials", "Installation Guide", "Knowledge Base", "Downloads", "Blog"],
  },
  {
    title: "Support",
    links: ["Help Center", "Submit Ticket", "FAQs", "Refund Policy", "Privacy Policy", "Contact Us"],
  },
]

export const footerBottomLinks = ["Terms & Conditions", "Privacy Policy", "Refund Policy", "DMCA"]
