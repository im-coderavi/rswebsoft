import crypto from "crypto"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { generateToken } from "../utils/generateToken.js"
import { generateUserId, USER_ID_PATTERN } from "../utils/generateUserId.js"
import { normalizePhone } from "../utils/normalizePhone.js"
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/mailService.js"
import User from "../models/User.js"

function toPublicUser(user) {
  return {
    id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
  }
}

// Retries on the unique-index race: two concurrent signups can generate the
// same ID, and the loser must get a different one rather than a 500.
async function createUserWithUniqueId(fields) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await User.create({ ...fields, userId: generateUserId() })
    } catch (err) {
      const isDuplicateUserId = err?.code === 11000 && err?.keyPattern?.userId
      if (!isDuplicateUserId) throw err
    }
  }
  throw new ApiError(500, "Could not allocate a user ID, please try again")
}

// Build the narrowest $or that could match what the customer typed. Anything
// with an "@" is an email; RSW-XXXXXX is a user ID; ten digits is a phone.
// A typed value that looks like none of those matches nothing, which still
// falls through to the same generic 401.
function identifierQuery(identifier) {
  const trimmed = identifier.trim()
  const or = []

  if (trimmed.includes("@")) {
    or.push({ email: trimmed.toLowerCase() })
  }
  if (USER_ID_PATTERN.test(trimmed.toUpperCase())) {
    or.push({ userId: trimmed.toUpperCase() })
  }
  const phone = normalizePhone(trimmed)
  if (phone) {
    or.push({ phone })
  }

  return or
}

export const login = asyncHandler(async (req, res) => {
  // `email` is still accepted so the admin login page keeps working until it
  // is migrated; both map onto the same identifier resolution.
  const identifier = req.body.identifier ?? req.body.email
  const { password } = req.body

  if (!identifier || !password) throw new ApiError(400, "Enter your login details and password")

  const or = identifierQuery(String(identifier))

  // Deliberately identical failure for "no such account" and "wrong password".
  // Distinguishing them tells an attacker which emails and phone numbers are
  // registered here.
  const invalid = new ApiError(401, "Invalid credentials")
  if (or.length === 0) throw invalid

  const user = await User.findOne({ $or: or }).select("+password")
  if (!user || !(await user.comparePassword(password))) throw invalid

  const token = generateToken(user)
  res.json({ token, user: toPublicUser(user) })
})

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashResetToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex")
}

export const me = asyncHandler(async (req, res) => {
  const body = { user: toPublicUser(req.user) }

  // Slide the session forward for anyone still using the site, so an active
  // customer is never forced to sign in again.
  //
  // The threshold is half the token's OWN lifetime rather than a fixed number
  // of days, so it stays correct whatever JWT_EXPIRES_IN is set to. A fixed
  // "renew after 7 days" silently never fires when the configured lifetime is
  // also 7 days — the token expires exactly as it becomes eligible.
  const { tokenIssuedAt: iat, tokenExpiresAt: exp } = req
  if (iat && exp) {
    const lifetimeSeconds = exp - iat
    const ageSeconds = Math.floor(Date.now() / 1000) - iat
    if (ageSeconds > lifetimeSeconds / 2) {
      body.token = generateToken(req.user)
    }
  }

  res.json(body)
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body

  // Always the same answer, always 200: replying "no such account" would let
  // anyone test which emails and phone numbers are registered here.
  const genericResponse = { message: "If that account exists, a reset link is on its way." }

  if (!identifier) return res.json(genericResponse)

  const or = identifierQuery(String(identifier))
  if (or.length === 0) return res.json(genericResponse)

  const user = await User.findOne({ $or: or })
  if (!user) return res.json(genericResponse)

  const rawToken = crypto.randomBytes(32).toString("hex")
  user.passwordResetToken = hashResetToken(rawToken)
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save()

  await sendPasswordResetEmail(user, rawToken)

  res.json(genericResponse)
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  if (!token) throw new ApiError(400, "This reset link is invalid or has expired")
  if (!password) throw new ApiError(400, "Password is required")
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters")

  const user = await User.findOne({
    passwordResetToken: hashResetToken(String(token)),
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +passwordResetToken +passwordResetExpires")

  if (!user) throw new ApiError(400, "This reset link is invalid or has expired")

  user.password = password
  user.tokenVersion = (user.tokenVersion ?? 0) + 1
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // Signed in immediately — the customer just proved control of the inbox.
  const newToken = generateToken(user)
  res.json({ token: newToken, user: toPublicUser(user) })
})

export const updateProfile = asyncHandler(async (req, res) => {
  // Only these two fields are read off the body. Assigning req.body wholesale
  // would let a crafted request set `role: "admin"` or overwrite `email`,
  // which is the account's only recovery channel.
  const { name, phone } = req.body

  const user = await User.findById(req.user._id)
  if (!user) throw new ApiError(404, "Account not found")

  if (name !== undefined) {
    if (!String(name).trim()) throw new ApiError(400, "Name cannot be empty")
    user.name = String(name).trim()
  }

  if (phone !== undefined) {
    const normalized = normalizePhone(phone)
    if (!normalized) throw new ApiError(400, "Enter a valid 10-digit Indian mobile number")

    if (normalized !== user.phone) {
      const taken = await User.exists({ phone: normalized, _id: { $ne: user._id } })
      if (taken) throw new ApiError(409, "That phone number is already registered")
      user.phone = normalized
    }
  }

  await user.save()
  res.json({ user: toPublicUser(user) })
})

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body

  if (!currentPassword || !password) throw new ApiError(400, "Both passwords are required")
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters")

  const user = await User.findById(req.user._id).select("+password")
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Your current password is not correct")
  }

  user.password = password
  user.tokenVersion = (user.tokenVersion ?? 0) + 1
  await user.save()

  // Bumping tokenVersion invalidated this caller's own token too, so hand
  // back a fresh one — they stay signed in here, everywhere else is signed out.
  const newToken = generateToken(user)
  res.json({ token: newToken, user: toPublicUser(user) })
})

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body

  if (!name?.trim()) throw new ApiError(400, "Name is required")
  if (!email?.trim()) throw new ApiError(400, "Email is required")
  if (!phone?.trim()) throw new ApiError(400, "Phone number is required")
  if (!password) throw new ApiError(400, "Password is required")
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters")

  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) throw new ApiError(400, "Enter a valid 10-digit Indian mobile number")

  const normalizedEmail = email.toLowerCase().trim()

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "That email is already registered")
  }
  if (await User.exists({ phone: normalizedPhone })) {
    throw new ApiError(409, "That phone number is already registered")
  }

  const user = await createUserWithUniqueId({
    name: name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
  })

  // A mail outage must not cost the customer their account — they are already
  // signed in, and can read the User ID off their account page.
  await sendWelcomeEmail(user)

  const token = generateToken(user)
  res.status(201).json({ token, user: toPublicUser(user) })
})
