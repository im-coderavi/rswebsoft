import mongoose from "mongoose"
import { slugify } from "../utils/slugify.js"

const filtersSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    type: {
      type: String,
      enum: ["any", "plugin", "theme", "ready-website", "delivered-website", "package", "saas", "source-code", "tool", "other"],
      default: "any",
    },
    onlyFeatured: { type: Boolean, default: false },
  },
  { _id: false }
)

const homeSectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    slug: { type: String, unique: true },
    layout: { type: String, enum: ["grid", "carousel", "showcase"], default: "grid" },
    selectionMode: { type: String, enum: ["auto", "manual"], default: "auto" },
    filters: { type: filtersSchema, default: () => ({}) },
    manualProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    maxItems: { type: Number, default: 8, min: 1, max: 48 },
    ctaLink: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

homeSectionSchema.pre("validate", function (next) {
  if (this.isNew || this.isModified("title")) {
    this.slug = `${slugify(this.title)}-${Date.now().toString(36)}`
  }
  next()
})

export default mongoose.model("HomeSection", homeSectionSchema)
