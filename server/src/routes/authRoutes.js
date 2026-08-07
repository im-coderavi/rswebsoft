import { Router } from "express"
import {
  login,
  me,
  startSignup,
  resendSignupOtp,
  verifySignup,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
} from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"

const router = Router()

router.post("/login", login)

// Signup is deliberately two calls. There is no endpoint that creates an
// account outright — the old POST /register did, and leaving it in place
// would let anyone skip the email check entirely.
router.post("/signup/start", startSignup)
router.post("/signup/resend", resendSignupOtp)
router.post("/signup/verify", verifySignup)

router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.post("/change-password", protect, changePassword)
router.patch("/profile", protect, updateProfile)
router.get("/me", protect, me)

export default router
