import mongoose from "mongoose"

const demoLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    icon: { type: String, default: "Monitor" },
    url: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model("DemoLink", demoLinkSchema)
