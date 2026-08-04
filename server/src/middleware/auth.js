import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import User from "../models/User.js"

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated")
  }

  const token = header.split(" ")[1]
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new ApiError(401, "Invalid or expired token")
  }

  const user = await User.findById(payload.id)
  if (!user) throw new ApiError(401, "User no longer exists")

  // Tokens minted before this shipped carry no `tv`, and users created before
  // it have no `tokenVersion`. Both default to 0 so existing sessions survive
  // the deploy rather than everyone being signed out at once.
  if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new ApiError(401, "Session expired, please sign in again")
  }

  req.tokenIssuedAt = payload.iat
  req.tokenExpiresAt = payload.exp
  req.user = user
  next()
})

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Admin access required")
  }
  next()
}
