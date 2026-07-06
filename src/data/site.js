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

export const categories = [
  { icon: "Wordpress", name: "WordPress Plugins", count: "120+ Products", tone: "violet" },
  { icon: "Wordpress", name: "WordPress Themes", count: "80+ Products", tone: "indigo" },
  { icon: "Globe", name: "Ready Websites", count: "200+ Products", tone: "pink" },
  { icon: "Cloud", name: "SaaS Software", count: "60+ Products", tone: "teal" },
  { icon: "Sparkles", name: "AI Tools", count: "40+ Products", tone: "amber" },
  { icon: "Code2", name: "Source Codes", count: "200+ Products", tone: "sky" },
  { icon: "FileCode2", name: "PHP Scripts", count: "90+ Products", tone: "rose" },
  { icon: "Atom", name: "Laravel Projects", count: "50+ Products", tone: "red" },
  { icon: "Boxes", name: "React Projects", count: "40+ Products", tone: "cyan" },
  { icon: "Smartphone", name: "Mobile Apps", count: "35+ Products", tone: "blue" },
  { icon: "LayoutTemplate", name: "Templates", count: "60+ Products", tone: "orange" },
  { icon: "Package", name: "Bundles", count: "25+ Products", tone: "fuchsia" },
  { icon: "Palette", name: "Graphics", count: "70+ Products", tone: "pink" },
  { icon: "Megaphone", name: "Marketing Tools", count: "50+ Products", tone: "rose" },
  { icon: "TrendingUp", name: "SEO Tools", count: "40+ Products", tone: "emerald" },
  { icon: "FileText", name: "Documents", count: "80+ Products", tone: "sky" },
  { icon: "GraduationCap", name: "Courses", count: "40+ Products", tone: "lime" },
  { icon: "BookOpen", name: "eBooks", count: "30+ Products", tone: "amber" },
  { icon: "Wrench", name: "Developer Tools", count: "90+ Products", tone: "violet" },
  { icon: "LayoutGrid", name: "More Categories", count: "View All", tone: "indigo" },
]

export const popularPlugins = [
  { name: "Rank Math SEO Pro", tag: "SEO Plugin for WordPress", price: 59, rating: 4.9, reviews: 4060, tone: "violet", initials: "RM" },
  { name: "WP Rocket", tag: "Speed Optimization", price: 49, rating: 4.9, reviews: 3948, tone: "orange", initials: "WR" },
  { name: "WPForms Pro", tag: "Form Builder Plugin", price: 49, rating: 4.8, reviews: 3020, tone: "sky", initials: "WF" },
  { name: "Elementor Pro", tag: "Page Builder", price: 59, rating: 4.8, reviews: 2850, tone: "pink", initials: "EL" },
  { name: "WooCommerce", tag: "eCommerce Plugin", price: 49, rating: 4.7, reviews: 2100, tone: "fuchsia", initials: "WC" },
  { name: "Slider Revolution", tag: "Responsive Slider", price: 59, rating: 4.8, reviews: 1800, tone: "emerald", initials: "SR" },
]

export const premiumThemes = [
  { name: "Astra Pro", tag: "Multipurpose Theme", price: 59, rating: 4.9, reviews: 3250, tone: "violet", initials: "AS" },
  { name: "WoodMart", tag: "WooCommerce Theme", price: 59, rating: 4.9, reviews: 2640, tone: "emerald", initials: "WM" },
  { name: "TheGem", tag: "Creative Theme", price: 59, rating: 4.8, reviews: 1860, tone: "sky", initials: "TG" },
  { name: "Newspaper", tag: "News & Magazine", price: 59, rating: 4.8, reviews: 1760, tone: "rose", initials: "NP" },
  { name: "Avada", tag: "Multi-Purpose Theme", price: 59, rating: 4.8, reviews: 1460, tone: "amber", initials: "AV" },
  { name: "Porto", tag: "Business Theme", price: 59, rating: 4.7, reviews: 1360, tone: "blue", initials: "PO" },
]

export const readyWebsites = [
  { name: "Restaurant Kit", pages: "35+ Pages", price: 49, tone: "amber" },
  { name: "School Management", pages: "25+ Pages", price: 49, tone: "sky" },
  { name: "Hospital & Clinic", pages: "30+ Pages", price: 49, tone: "teal" },
  { name: "Gym & Fitness", pages: "20+ Pages", price: 49, tone: "violet" },
  { name: "Real Estate", pages: "25+ Pages", price: 49, tone: "emerald" },
  { name: "Portfolio Agency", pages: "20+ Pages", price: 49, tone: "pink" },
]

export const brands = [
  { name: "WPKartPro", tag: "WordPress Products", icon: "ShoppingCart", tone: "orange" },
  { name: "ToolzyPro", tag: "Software & Tools", icon: "Wrench", tone: "violet" },
  { name: "WPTemplatesHub", tag: "Ready Websites", icon: "LayoutTemplate", tone: "pink" },
  { name: "CodexBazaar", tag: "Source Codes", icon: "Code2", tone: "teal" },
  { name: "AppsClap", tag: "AI Tools", icon: "Sparkles", tone: "sky" },
  { name: "BizzProfile", tag: "Digital Business Profile", icon: "Building2", tone: "emerald" },
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
