import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { generateToken } from "../utils/generateToken.js"
import User from "../models/User.js"

function toPublicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
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
