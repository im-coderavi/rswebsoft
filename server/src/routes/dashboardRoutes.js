import { Router } from "express"
import { getStats, getPublicStats } from "../controllers/dashboardController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/stats", protect, adminOnly, getStats)
router.get("/public-stats", getPublicStats)

export default router
