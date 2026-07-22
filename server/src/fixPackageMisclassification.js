import "dotenv/config";
import { connectDB } from "./config/db.js";
import Product from "./models/Product.js";

// One-time, non-destructive correction for products that were wrongly tagged
// type: "package" by the old CSV import classifier (see import.js) - it used
// to also match "bundle", "kit", "canva", "planner", "checklist", "excel",
// "prompts", etc, mixing unrelated digital bundles into the same type as the
// 5 real web development pricing plans (Standard/Premium/Custom/Premium
// E-commerce/Multi-vendor). This only updates the `type` field on the
// wrongly-tagged products to "other" - it does not delete or touch anything
// else, and is safe to run more than once.

const REAL_PACKAGE_NAMES = new Set([
  "standard plan",
  "premium plan",
  "custom plan (pro)",
  "premium e-commerce plan",
  "multi-vendor e-commerce plan",
]);

async function run() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Connected.");

  const packageProducts = await Product.find({ type: "package" });
  console.log(`Found ${packageProducts.length} products currently tagged type: "package".`);

  const toKeep = [];
  const toFix = [];
  for (const product of packageProducts) {
    if (REAL_PACKAGE_NAMES.has(product.name.trim().toLowerCase())) {
      toKeep.push(product);
    } else {
      toFix.push(product);
    }
  }

  console.log(`\nKeeping as "package" (real pricing plans): ${toKeep.length}`);
  toKeep.forEach((p) => console.log(`  - ${p.name}`));

  console.log(`\nRetagging to "other" (misclassified bundles/courses/etc): ${toFix.length}`);
  toFix.forEach((p) => console.log(`  - ${p.name}`));

  if (toFix.length > 0) {
    const ids = toFix.map((p) => p._id);
    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { type: "other" } });
    console.log(`\nUpdated ${result.modifiedCount} products to type: "other".`);
  } else {
    console.log("\nNothing to fix.");
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
