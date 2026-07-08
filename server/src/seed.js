import "dotenv/config"
import { connectDB } from "./config/db.js"
import Category from "./models/Category.js"
import Brand from "./models/Brand.js"
import Product from "./models/Product.js"
import PaymentSetting from "./models/PaymentSetting.js"
import User from "./models/User.js"
import { slugify } from "./utils/slugify.js"

// Mirrors src/data/site.js so the admin panel starts with the same catalog
// shape the storefront mock data already uses.
const categories = [
  { icon: "Wordpress", name: "WordPress Plugins", tone: "violet" },
  { icon: "Wordpress", name: "WordPress Themes", tone: "indigo" },
  { icon: "Globe", name: "Ready Websites", tone: "pink" },
  { icon: "Cloud", name: "SaaS Software", tone: "teal" },
  { icon: "Sparkles", name: "AI Tools", tone: "amber" },
  { icon: "Code2", name: "Source Codes", tone: "sky" },
  { icon: "FileCode2", name: "PHP Scripts", tone: "rose" },
  { icon: "Atom", name: "Laravel Projects", tone: "red" },
  { icon: "Boxes", name: "React Projects", tone: "cyan" },
  { icon: "Smartphone", name: "Mobile Apps", tone: "blue" },
  { icon: "LayoutTemplate", name: "Templates", tone: "orange" },
  { icon: "Package", name: "Bundles", tone: "fuchsia" },
  { icon: "Palette", name: "Graphics", tone: "pink" },
  { icon: "Megaphone", name: "Marketing Tools", tone: "rose" },
  { icon: "TrendingUp", name: "SEO Tools", tone: "emerald" },
  { icon: "FileText", name: "Documents", tone: "sky" },
  { icon: "GraduationCap", name: "Courses", tone: "lime" },
  { icon: "BookOpen", name: "eBooks", tone: "amber" },
  { icon: "Wrench", name: "Developer Tools", tone: "violet" },
]

const brands = [
  { name: "WPKartPro", tag: "WordPress Products", icon: "ShoppingCart", tone: "orange" },
  { name: "ToolzyPro", tag: "Software & Tools", icon: "Wrench", tone: "violet" },
  { name: "WPTemplatesHub", tag: "Ready Websites", icon: "LayoutTemplate", tone: "pink" },
  { name: "CodexBazaar", tag: "Source Codes", icon: "Code2", tone: "teal" },
  { name: "AppsClap", tag: "AI Tools", icon: "Sparkles", tone: "sky" },
  { name: "BizzProfile", tag: "Digital Business Profile", icon: "Building2", tone: "emerald" },
]

// Hex pairs for placehold.co demo images — mirrors src/lib/tones.js so seeded
// products look consistent with the site's palette without importing across packages.
const TONE_HEX = {
  violet: "8b5cf6",
  indigo: "6366f1",
  pink: "ec4899",
  fuchsia: "d946ef",
  teal: "14b8a6",
  sky: "38bdf8",
  blue: "3b82f6",
  amber: "f59e0b",
  orange: "fb923c",
  rose: "fb7185",
  emerald: "10b981",
}

function placeholderImage(name, tone) {
  const hex = TONE_HEX[tone] || TONE_HEX.violet
  const text = encodeURIComponent(name)
  return {
    url: `https://placehold.co/800x600/${hex}/ffffff?text=${text}`,
    publicId: `seed/${slugify(name)}`,
  }
}

const demoProducts = [
  // Plugins
  { name: "Rank Math SEO Pro", tag: "SEO Plugin for WordPress", price: 59, rating: 4.9, reviews: 4060, tone: "violet", category: "WordPress Plugins", type: "plugin", featured: true },
  { name: "WP Rocket", tag: "Speed Optimization", price: 49, rating: 4.9, reviews: 3948, tone: "orange", category: "WordPress Plugins", type: "plugin", featured: true },
  { name: "WPForms Pro", tag: "Form Builder Plugin", price: 49, rating: 4.8, reviews: 3020, tone: "sky", category: "WordPress Plugins", type: "plugin" },
  { name: "Elementor Pro", tag: "Page Builder", price: 59, rating: 4.8, reviews: 2850, tone: "pink", category: "WordPress Plugins", type: "plugin" },
  { name: "WooCommerce", tag: "eCommerce Plugin", price: 49, rating: 4.7, reviews: 2100, tone: "fuchsia", category: "WordPress Plugins", type: "plugin" },
  { name: "Slider Revolution", tag: "Responsive Slider", price: 59, rating: 4.8, reviews: 1800, tone: "emerald", category: "WordPress Plugins", type: "plugin" },

  // Themes
  { name: "Astra Pro", tag: "Multipurpose Theme", price: 59, rating: 4.9, reviews: 3250, tone: "violet", category: "WordPress Themes", type: "theme", featured: true },
  { name: "WoodMart", tag: "WooCommerce Theme", price: 59, rating: 4.9, reviews: 2640, tone: "emerald", category: "WordPress Themes", type: "theme", featured: true },
  { name: "TheGem", tag: "Creative Theme", price: 59, rating: 4.8, reviews: 1860, tone: "sky", category: "WordPress Themes", type: "theme" },
  { name: "Newspaper", tag: "News & Magazine", price: 59, rating: 4.8, reviews: 1760, tone: "rose", category: "WordPress Themes", type: "theme" },
  { name: "Avada", tag: "Multi-Purpose Theme", price: 59, rating: 4.8, reviews: 1460, tone: "amber", category: "WordPress Themes", type: "theme" },
  { name: "Porto", tag: "Business Theme", price: 59, rating: 4.7, reviews: 1360, tone: "blue", category: "WordPress Themes", type: "theme" },

  // Ready websites
  { name: "Restaurant Kit", tag: "35+ Page Restaurant Website", price: 49, rating: 4.6, reviews: 320, tone: "amber", category: "Ready Websites", type: "ready-website", featured: true },
  { name: "School Management Site", tag: "25+ Page Education Website", price: 49, rating: 4.5, reviews: 210, tone: "sky", category: "Ready Websites", type: "ready-website" },
  { name: "Hospital & Clinic Kit", tag: "30+ Page Healthcare Website", price: 49, rating: 4.7, reviews: 180, tone: "teal", category: "Ready Websites", type: "ready-website" },
  { name: "Gym & Fitness Kit", tag: "20+ Page Fitness Website", price: 49, rating: 4.6, reviews: 240, tone: "violet", category: "Ready Websites", type: "ready-website" },
  { name: "Real Estate Kit", tag: "25+ Page Real Estate Website", price: 49, rating: 4.8, reviews: 300, tone: "emerald", category: "Ready Websites", type: "ready-website", featured: true },
  { name: "Portfolio Agency Kit", tag: "20+ Page Agency Website", price: 49, rating: 4.5, reviews: 150, tone: "pink", category: "Ready Websites", type: "ready-website" },

  // SaaS
  { name: "InvoiceFlow Pro", tag: "Invoicing & Billing SaaS", price: 29, rating: 4.6, reviews: 540, tone: "teal", category: "SaaS Software", type: "saas" },
  { name: "TeamSync CRM", tag: "Sales & Team CRM", price: 39, rating: 4.7, reviews: 610, tone: "sky", category: "SaaS Software", type: "saas" },
  { name: "Analytics Hub", tag: "Web Analytics Dashboard", price: 49, rating: 4.5, reviews: 320, tone: "indigo", category: "SaaS Software", type: "saas" },

  // AI tools
  { name: "ContentGenie AI Writer", tag: "AI Content Generation", price: 19, rating: 4.8, reviews: 890, tone: "amber", category: "AI Tools", type: "other", featured: true },
  { name: "PixelCraft AI Image Suite", tag: "AI Image Generation", price: 29, rating: 4.7, reviews: 430, tone: "fuchsia", category: "AI Tools", type: "other" },
  { name: "ChatBot Builder AI", tag: "No-Code AI Chatbot Builder", price: 39, rating: 4.6, reviews: 275, tone: "violet", category: "AI Tools", type: "other" },

  // Source code
  { name: "Food Delivery App Source", tag: "Full Source Code + Admin Panel", price: 89, rating: 4.6, reviews: 140, tone: "orange", category: "Source Codes", type: "source-code" },
  { name: "Social Network Clone Script", tag: "PHP Social Network Script", price: 99, rating: 4.5, reviews: 95, tone: "blue", category: "Source Codes", type: "source-code" },
  { name: "Chat App React Native Source", tag: "Cross-Platform Chat App", price: 79, rating: 4.7, reviews: 160, tone: "sky", category: "Source Codes", type: "source-code" },
]

async function seed() {
  await connectDB()

  for (const c of categories) {
    await Category.updateOne(
      { name: c.name },
      { $setOnInsert: { ...c, slug: slugify(c.name) } },
      { upsert: true }
    )
  }
  console.log(`Seeded ${categories.length} categories`)

  for (const b of brands) {
    await Brand.updateOne(
      { name: b.name },
      { $setOnInsert: { ...b, slug: slugify(b.name) } },
      { upsert: true }
    )
  }
  console.log(`Seeded ${brands.length} brands`)

  const categoryDocs = await Category.find()
  const categoryIdByName = new Map(categoryDocs.map((c) => [c.name, c._id]))

  let createdProducts = 0
  for (const p of demoProducts) {
    const exists = await Product.findOne({ name: p.name })
    if (exists) continue

    await Product.create({
      name: p.name,
      shortDescription: p.tag,
      description: p.tag,
      price: p.price,
      category: categoryIdByName.get(p.category),
      type: p.type,
      rating: p.rating,
      numReviews: p.reviews,
      featured: Boolean(p.featured),
      status: "published",
      images: [placeholderImage(p.name, p.tone)],
    })
    createdProducts++
  }
  console.log(`Seeded ${createdProducts} demo products (${demoProducts.length - createdProducts} already existed)`)

  const existingSettings = await PaymentSetting.findOne()
  if (!existingSettings) {
    await PaymentSetting.create({})
    console.log("Seeded empty payment settings (fill in from /admin/settings)")
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const existingAdmin = await User.findOne({ email: adminEmail })
  if (!existingAdmin) {
    await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    })
    console.log(`Created admin user: ${adminEmail} / ${process.env.ADMIN_PASSWORD}`)
  } else {
    console.log(`Admin user already exists: ${adminEmail}`)
  }

  console.log("Seed complete")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
