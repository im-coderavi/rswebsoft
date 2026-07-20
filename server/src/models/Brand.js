import mongoose from "mongoose"
import { slugify } from "../utils/slugify.js"

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true },
    tag: { type: String, default: "" },
    icon: { type: String, default: "Building2" },
    tone: { type: String, default: "violet" },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },
  { timestamps: true }
)

brandSchema.pre("validate", function (next) {
  if (this.name) this.slug = slugify(this.name)
  next()
})

export default mongoose.model("Brand", brandSchema)
