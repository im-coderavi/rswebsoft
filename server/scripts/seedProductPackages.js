import "dotenv/config"
import { connectDB } from "../src/config/db.js"
import Product from "../src/models/Product.js"

const INSTALLATION_MARKUP = 499

async function run() {
  await connectDB()

  const products = await Product.find()
  let seeded = 0
  let skipped = 0

  for (const product of products) {
    if (product.packages && product.packages.length > 0) {
      skipped += 1
      continue
    }

    product.packages = [
      { name: "Buy Source Code", price: product.price },
      { name: "Installation", price: product.price + INSTALLATION_MARKUP },
    ]
    await product.save()
    seeded += 1
  }

  console.log(`Seeded packages for ${seeded} product(s), skipped ${skipped} (already had packages).`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
