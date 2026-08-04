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

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) throw new ApiError(400, "Email and password are required")

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password")
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password")
  }

  const token = generateToken(user)
  res.json({ token, user: toPublicUser(user) })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ user: toPublicUser(req.user) })
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
