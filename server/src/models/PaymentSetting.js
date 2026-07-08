import mongoose from "mongoose"

// Singleton document — always accessed via findOne() / upsert, never by id.
const paymentSettingSchema = new mongoose.Schema(
  {
    upiId: { type: String, default: "" },
    payeeName: { type: String, default: "" },
    qrImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
)

export default mongoose.model("PaymentSetting", paymentSettingSchema)
