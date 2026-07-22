import { Router } from "express"
import { listOrders, updateOrderStatus, createOrder, trackOrder, myOrders } from "../controllers/orderController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listOrders)
router.get("/mine", protect, myOrders)
router.post("/", protect, createOrder)
router.get("/:id/track", trackOrder)
router.put("/:id", protect, adminOnly, updateOrderStatus)

export default router
