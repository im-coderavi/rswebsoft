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

productSchema.pre("validate", function (next) {
  if (this.isNew || this.isModified("name")) {
    this.slug = `${slugify(this.name)}-${Date.now().toString(36)}`
  }
  next()
})

productSchema.index({ name: "text", description: "text", tags: "text" })

export default mongoose.model("Product", productSchema)
