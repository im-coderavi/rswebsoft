import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
)

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customer: { type: customerSchema, required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["upi"], default: "upi" },
    paymentReference: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "paid", "fulfilled", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
)

export default mongoose.model("Order", orderSchema)
