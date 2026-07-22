import { Router } from "express"
import { subscribe, listSubscribers, deleteSubscriber } from "../controllers/subscriberController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.post("/", subscribe)
router.get("/", protect, adminOnly, listSubscribers)
router.delete("/:id", protect, adminOnly, deleteSubscriber)

export default router
