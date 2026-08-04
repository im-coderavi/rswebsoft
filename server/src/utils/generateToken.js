import jwt from "jsonwebtoken"

// `tv` carries the user's tokenVersion. `protect` compares it on every
// request, which is what makes "changing your password signs you out
// everywhere else" possible with stateless JWTs.
export function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, tv: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
  )
}
