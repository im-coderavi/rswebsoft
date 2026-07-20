import { Router } from "express"
import { listOrders, updateOrderStatus, createOrder, trackOrder } from "../controllers/orderController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listOrders)
router.post("/", createOrder)
router.get("/:id/track", trackOrder)
router.put("/:id", protect, adminOnly, updateOrderStatus)

export default router
