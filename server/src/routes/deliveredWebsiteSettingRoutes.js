import { Router } from "express"
import {
  getDeliveredWebsiteSettings,
  updateDeliveredWebsiteSettings,
} from "../controllers/deliveredWebsiteSettingController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", getDeliveredWebsiteSettings)
router.put("/", protect, adminOnly, updateDeliveredWebsiteSettings)

export default router
