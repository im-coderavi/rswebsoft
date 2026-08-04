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

// One row per machine that has tried to unlock this licence. The first few are
// approved automatically — a real buyer moving between their phone and laptop
// shouldn't have to wait on anyone — and everything after that needs the shop
// to say yes, which is what stops a key being passed around.
//
// deviceId is a random value the browser keeps in localStorage. A technical
// user can copy it between machines; the ip and userAgent recorded here are
// what let the admin see that for what it is.
const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    status: { type: String, enum: ["approved", "pending", "denied"], default: "pending" },
    label: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    decidedAt: { type: Date, default: null },
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

    devices: [deviceSchema],

    // Single-use, 60-second ticket for the download redirect. The browser
    // navigates to /licences/open/<token>, which is a plain navigation and so
    // carries no Authorization header — the token itself is the credential.
    // Stored hashed and cleared on use, so it is worthless once redeemed or
    // if the database is read.
    openToken: { type: String, default: null, select: false },
    openTokenExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
)

// The pair a licence is looked up by when an order is delivered, so re-sending
// a delivery email reuses the existing licence instead of minting a second one.
licenceSchema.index({ order: 1, product: 1 }, { unique: true })

export default mongoose.model("Licence", licenceSchema)
