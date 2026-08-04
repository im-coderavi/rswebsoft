import { Router } from "express"
import {
  login,
  me,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"

const router = Router()

router.post("/login", login)
router.post("/register", register)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.post("/change-password", protect, changePassword)
router.get("/me", protect, me)

export default router
