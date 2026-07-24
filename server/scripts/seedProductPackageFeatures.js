import "dotenv/config"
import { connectDB } from "../src/config/db.js"
import Product from "../src/models/Product.js"

const DEFAULT_FEATURES = {
  "Buy Source Code": [
    "Full source code files",
    "Free lifetime updates",
    "Documentation included",
    "Email support for setup queries",
  ],
  Installation: [
    "Everything in Buy Source Code",
    "Professional installation on your hosting server",
    "Domain & server configuration",
    "1-on-1 setup call with our team",
    "7-day post-installation support",
  ],
}

async function run() {
  await connectDB()

  const products = await Product.find()
  let updated = 0

  for (const product of products) {
    let changed = false
    for (const pkg of product.packages) {
      const defaults = DEFAULT_FEATURES[pkg.name]
      if (defaults && (!pkg.features || pkg.features.length === 0)) {
        pkg.features = defaults
        changed = true
      }
    }
    if (changed) {
      await product.save()
      updated += 1
    }
  }

  console.log(`Added demo features to packages on ${updated} product(s).`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
