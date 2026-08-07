import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatarUrl: { type: String, default: "" },

    // Short, human-quotable account number shown to the customer and accepted
    // as a login identifier. Sparse because accounts created before this
    // shipped have none until scripts/backfillUserIds.js runs.
    userId: { type: String, unique: true, sparse: true, uppercase: true, trim: true },

    // Stored normalised (10 digits, no country code) by normalizePhone.
    // NOT `required` at schema level: pre-existing users have no phone, and a
    // schema requirement would make every later .save() on them fail
    // validation — including an admin password change. The register
    // controller enforces it for new signups instead.
    phone: { type: String, unique: true, sparse: true, trim: true },

    // Bumped on every password change. `protect` compares it to the token's
    // `tv` claim, so changing a password signs out every other device.
    tokenVersion: { type: Number, default: 0 },

    // When the emailed code was entered. Every account created after signup
    // verification shipped has this; the handful that predate it are null,
    // which is honest — nobody ever proved those addresses.
    emailVerifiedAt: { type: Date, default: null },

    // SHA-256 hash of the token that went out in the reset email — never the
    // raw token, so a leaked database dump cannot be used to take accounts.
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  // Signup verification hands over a password that was already hashed when the
  // pending record was created, so the plaintext never had to be stored while
  // waiting for the emailed code. Hashing it a second time here would produce
  // a password nobody could ever log in with.
  if (this.$locals.passwordAlreadyHashed) return next()

  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model("User", userSchema)
