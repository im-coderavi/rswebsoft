import mongoose from "mongoose"

// Singleton document — always accessed via findOne() / upsert, never by id.
//
// Unlike PaymentSetting this is NEVER exposed publicly: it holds an API key,
// and the number here is the shop owner's own phone, not something a customer
// should be able to read off the storefront.
const notificationSettingSchema = new mongoose.Schema(
  {
    whatsappEnabled: { type: Boolean, default: false },

    // Where the alert goes — digits with country code, e.g. "919582891675".
    whatsappPhone: { type: String, default: "" },

    // CallMeBot key, obtained by messaging their bot from this same number.
    whatsappApiKey: { type: String, default: "" },

    // Set on every attempt so the admin can see whether alerts are actually
    // arriving. CallMeBot is a free hobby service with no uptime promise, so
    // silent failure is a realistic thing to have to diagnose.
    lastAttemptAt: { type: Date, default: null },
    lastResult: { type: String, enum: ["ok", "failed", ""], default: "" },
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
)

export default mongoose.model("NotificationSetting", notificationSettingSchema)
