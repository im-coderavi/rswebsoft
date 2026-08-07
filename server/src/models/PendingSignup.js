import mongoose from "mongoose"

// A signup that has been started but not yet proved. No User document exists
// until the code from the email is entered, so an abandoned or automated
// attempt leaves nothing behind in the real accounts collection.
const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    // Already bcrypt-hashed when it lands here — the plaintext password is
    // never stored, not even for the few minutes this record lives.
    passwordHash: { type: String, required: true, select: false },

    // SHA-256 of the six digits. Someone reading this collection still can't
    // complete a signup they didn't start.
    otpHash: { type: String, required: true, select: false },
    otpExpires: { type: Date, required: true },

    // Wrong codes entered. Caps brute force at a handful of guesses rather
    // than the 1-in-a-million the code length would otherwise allow.
    attempts: { type: Number, default: 0 },

    // Emails sent for this address, and when the last one went out. Both are
    // checked before sending again.
    sendCount: { type: Number, default: 1 },
    lastSentAt: { type: Date, default: Date.now },

    // Mongo drops the document itself once this passes, so abandoned signups
    // clean themselves up and the email is free to try again later.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
)

export default mongoose.model("PendingSignup", pendingSignupSchema)
