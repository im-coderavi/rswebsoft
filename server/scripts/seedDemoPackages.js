import "dotenv/config"
import { connectDB } from "../src/config/db.js"
import Product from "../src/models/Product.js"
import Category from "../src/models/Category.js"

async function run() {
  await connectDB()

  try {
    // Delete all existing package-type products
    const deleted = await Product.deleteMany({ type: "package" })
    console.log(`Deleted ${deleted.deletedCount} existing package products`)

    // Get or create "Services" category for packages
    let category = await Category.findOne({ name: "Web Development" })
    if (!category) {
      category = await Category.create({
        name: "Web Development",
        slug: "web-development",
        icon: "🌐",
        tone: "info",
      })
      console.log("Created 'Web Development' category")
    }

    const demoPackages = [
      {
        name: "Custom Plan (Pro)",
        shortDescription: "Tailored web solution for your business",
        displayTag: "",
        description: "A fully customized web solution tailored to your specific business needs. Perfect for unique requirements and complex projects.",
        price: 64000,
        salePrice: null,
        category: category._id,
        type: "package",
        tags: ["custom", "most popular"],
        features: [
          "Pages: According to Requirement",
          "1 Year Free Domain Name (.com / .in / .org)",
          "1 Year Free Cloud Hosting",
          "Dynamic Website",
          "Admin Access",
          "Google Search Console Setup",
          "Lifetime 24/7 Free Hosting Support",
          "Unlimited Images & Videos Upload",
          "Free SSL Certificates",
        ],
        demoUrl: "https://wa.me/917000000000?text=I%20am%20interested%20in%20Custom%20Plan",
        status: "published",
        featured: true,
      },
      {
        name: "Ultimate Crochet Patterns & Design Bundle (10,000+ Files)",
        shortDescription: "Get 10,000+ Crochet Patterns, Templates & Design Files for all skill levels",
        displayTag: "",
        description: "A mega bundle containing 10,000+ crochet patterns, templates, and design files for every skill level. Everything you need to master crochet design.",
        price: 999,
        salePrice: 129,
        category: category._id,
        type: "package",
        tags: ["offer price"],
        features: [
          "Mega Bundle Premium Digital Assets",
          "Lifetime Download Access & Links",
          "High Resolution Customizable Elements",
          "Fully Organized & Structured Folders",
          "Commercial Usage Licenses Included",
        ],
        status: "published",
        featured: false,
      },
      {
        name: "PREMIUM INFOGRAPHICS BUNDLE 2.0",
        shortDescription: "Unlock 1000+ premium infographic templates for presentations, reports, and more",
        displayTag: "",
        description: "Unlock 1000+ premium infographic templates for presentations, reports, and data visualization. AI, EPS, PSD, PPTX, Canva links ready to use.",
        price: 599,
        salePrice: 129,
        category: category._id,
        type: "package",
        tags: ["offer price"],
        features: [
          "Type: 100% Digital Product (No physical shipping)",
          "Format: AI, EPS, PSD, PPTX, Canva links",
          "Delivery: Instant download link provided immediately after purchase",
          "Access: Lifetime access with unlimited downloads",
          "Usage: Ready-to-use and customizable for personal & commercial use",
        ],
        status: "published",
        featured: false,
      },
    ]

    for (const pkg of demoPackages) {
      const created = await Product.create(pkg)
      console.log(`Created package: ${created.name}`)
    }

    console.log("\n✅ Demo packages seeded successfully!")
    console.log("3 packages are now ready to display on the homepage pricing section.")
    process.exit(0)
  } catch (err) {
    console.error("Error seeding demo packages:", err)
    process.exit(1)
  }
}

run()
