import { Router } from "express"
import { listBrands, createBrand, updateBrand, deleteBrand } from "../controllers/brandController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", listBrands)
router.post("/", protect, adminOnly, createBrand)
router.put("/:id", protect, adminOnly, updateBrand)
router.delete("/:id", protect, adminOnly, deleteBrand)

export default router
