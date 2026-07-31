import mongoose from "mongoose"
import { ApiError } from "../utils/apiError.js"

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["all", "products"], default: "all" },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Boolean, default: false },
    minOrderValue: { type: Number, default: null, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
)

couponSchema.pre("validate", function (next) {
  if (this.discountType === "percentage" && this.discountValue > 100) {
    return next(new ApiError(400, "Percentage discount cannot exceed 100"))
  }
  if (this.appliesTo === "products" && this.products.length === 0) {
    return next(new ApiError(400, "Select at least one product for a product-specific coupon"))
  }
  next()
})

export default mongoose.model("Coupon", couponSchema)
