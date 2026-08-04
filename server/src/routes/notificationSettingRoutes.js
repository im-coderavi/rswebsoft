import { Router } from "express"
import {
  getNotificationSettings,
  updateNotificationSettings,
  testNotification,
} from "../controllers/notificationSettingController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

// No public route here on purpose — this document holds an API key.
router.get("/", protect, adminOnly, getNotificationSettings)
router.put("/", protect, adminOnly, updateNotificationSettings)
router.post("/test", protect, adminOnly, testNotification)

export default router
