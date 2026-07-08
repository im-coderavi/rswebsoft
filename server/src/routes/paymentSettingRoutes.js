import { Router } from "express"
import { getPaymentSettings, updatePaymentSettings } from "../controllers/paymentSettingController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", getPaymentSettings)
router.put("/", protect, adminOnly, updatePaymentSettings)

export default router
