import mongoose from "mongoose"
import { slugify } from "../utils/slugify.js"

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },

    // Slugs this product used to live at. Changing a URL otherwise 404s every
    // link and search result pointing at the old one, so getProduct falls back
    // to these and the old address keeps working.
    previousSlugs: { type: [String], default: [], index: true },
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    displayTag: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    saleEndsAt: { type: Date },
    features: [{ type: String, trim: true }],
    packages: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: "" },
        features: [{ type: String, trim: true }],
      },
    ],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    type: {
      type: String,
      enum: ["plugin", "theme", "ready-website", "delivered-website", "package", "saas", "source-code", "tool", "other"],
      default: "other",
    },
    tags: [{ type: String, trim: true }],
    images: [imageSchema],
    demoUrl: { type: String, default: "" },

    // The delivered file and the password that opens it. Both are `select:
    // false` so they can never ride along in a public product response —
    // GET /products used to return downloadUrl for the whole catalogue, which
    // meant anyone could read every download link without buying anything.
    //
    // Read them only through:
    //   - GET /products/:id/download-config  (admin, for the product form)
    //   - the licence reveal endpoint         (the buyer, logged and revocable)
    // Never add them to a query that serves the storefront.
    downloadUrl: { type: String, default: "", select: false },
    downloadPassword: { type: String, default: "", select: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["published", "draft"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

// The slug is the product's public URL, so the admin owns it. This hook only
// fills one in when none was given, and normalises whatever was typed.
//
// It deliberately does NOT regenerate on rename any more. It used to, which
// meant tweaking a product title silently changed its URL and broke every
// inbound link and search result pointing at the old one.
productSchema.pre("validate", function (next) {
  if (this.slug) {
    this.slug = slugify(this.slug)
  }
  if (!this.slug && this.name) {
    // Bare slug, no timestamp suffix — the controller resolves collisions by
    // appending -2, -3, which reads far better than -mf3k2p.
    this.slug = slugify(this.name)
  }
  next()
})

productSchema.index({ name: "text", description: "text", tags: "text" })

export default mongoose.model("Product", productSchema)
