import mongoose from "mongoose"
import { slugify } from "../utils/slugify.js"

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true },
    icon: { type: String, default: "Box" },
    tone: { type: String, default: "violet" },
  },
  { timestamps: true }
)

categorySchema.pre("validate", function (next) {
  if (this.name) this.slug = slugify(this.name)
  next()
})

export default mongoose.model("Category", categorySchema)
