import { Router } from "express"
import { getStats } from "../controllers/dashboardController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/stats", protect, adminOnly, getStats)

export default router
