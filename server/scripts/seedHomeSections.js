import "dotenv/config"
import { connectDB } from "../src/config/db.js"
import HomeSection from "../src/models/HomeSection.js"

const sections = [
  { title: "Featured Products", subtitle: "Hand-picked, top-rated across every category", layout: "grid", filters: { onlyFeatured: true } },
  { title: "Popular WordPress Plugins", layout: "carousel", filters: { type: "plugin" } },
  { title: "Premium WordPress Themes", layout: "carousel", filters: { type: "theme" } },
  { title: "Ready Websites", layout: "grid", filters: { type: "ready-website" } },
  {
    title: "Websites I've Built & Delivered",
    subtitle: "Professional e-commerce websites with responsive design, fast performance, and seamless shopping experience.",
    layout: "showcase",
    filters: { type: "delivered-website" },
  },
  { title: "Handy Tools", layout: "carousel", filters: { type: "tool" } },
  { title: "Source Codes", layout: "carousel", filters: { type: "source-code" } },
  { title: "SaaS Software", layout: "carousel", filters: { type: "saas" } },
]

async function run() {
  await connectDB()

  for (let i = 0; i < sections.length; i++) {
    const def = sections[i]
    const exists = await HomeSection.findOne({ title: def.title })
    if (exists) {
      console.log(`Skipping "${def.title}" — already exists`)
      continue
    }
    await HomeSection.create({ ...def, order: i, maxItems: def.layout === "showcase" ? 6 : 8 })
    console.log(`Created "${def.title}"`)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
