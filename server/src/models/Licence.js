import mongoose from "mongoose"

// One licence per (order, product). The key is what the customer sees, quotes
// to support, and what the admin revokes. The download link and its password
// are never sent anywhere — they are only ever revealed through this licence,
// to its owner, while it is active, and every reveal is recorded.
const accessSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { _id: false }
)

const licenceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },

    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

    // Snapshot: the product can be renamed or deleted later, but the customer's
    // licence should still say what they bought.
    productName: { type: String, default: "" },

    status: { type: String, enum: ["active", "revoked"], default: "active", index: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: "" },

    accessCount: { type: Number, default: 0 },
    lastAccessAt: { type: Date, default: null },

    // Distinct source addresses, via $addToSet. This is the sharing signal —
    // one licence opened from many places. Treat it as a hint, never proof:
    // Indian mobile carriers rotate addresses constantly, so an honest
    // customer on 4G can legitimately show several in a day.
    distinctIps: [{ type: String }],

    // Most recent reveals, capped by $slice so the document can't grow without
    // bound on a licence that is hammered.
    accessLog: [accessSchema],
  },
  { timestamps: true }
)

// The pair a licence is looked up by when an order is delivered, so re-sending
// a delivery email reuses the existing licence instead of minting a second one.
licenceSchema.index({ order: 1, product: 1 }, { unique: true })

export default mongoose.model("Licence", licenceSchema)
