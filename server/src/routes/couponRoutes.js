import { Router } from "express"
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, applyCoupon } from "../controllers/couponController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listCoupons)
router.post("/", protect, adminOnly, createCoupon)
router.put("/:id", protect, adminOnly, updateCoupon)
router.delete("/:id", protect, adminOnly, deleteCoupon)
router.post("/apply", applyCoupon)

export default router
