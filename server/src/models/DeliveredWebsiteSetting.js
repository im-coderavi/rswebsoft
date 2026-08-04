import mongoose from "mongoose"

// Singleton document — always accessed via findOne() / upsert, never by id.
// Kept separate from PaymentSetting on purpose: that number is where a
// customer chases a payment, this one is where a prospect asks for a site to
// be built. They're usually the same today, but coupling them means the shop
// can never split them without a migration.
const deliveredWebsiteSettingSchema = new mongoose.Schema(
  {
    // Stored as bare digits with the country code, e.g. "919876543210",
    // because that is the shape wa.me links need.
    whatsappNumber: { type: String, default: "" },
  },
  { timestamps: true }
)

export default mongoose.model("DeliveredWebsiteSetting", deliveredWebsiteSettingSchema)
