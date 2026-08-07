import mongoose from "mongoose"

// Counters that expire on their own. Used to cap how many verification emails
// one address can trigger, which matters for two reasons: the shop sends
// through Gmail, which cuts you off at a few hundred a day, and without a cap
// this endpoint is a way to bomb a stranger's inbox on someone else's quota.
//
// Kept in the database rather than in memory on purpose — production runs as
// serverless functions, so an in-process counter would reset constantly and
// enforce nothing.
const rateLimitSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
)

export default mongoose.model("RateLimit", rateLimitSchema)
