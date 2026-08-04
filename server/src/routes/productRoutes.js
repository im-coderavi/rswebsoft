import { Router } from "express"
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  getProductDownloadConfig,
} from "../controllers/productController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", listProducts)
router.post("/bulk-delete", protect, adminOnly, bulkDeleteProducts)
router.patch("/bulk-status", protect, adminOnly, bulkUpdateProductStatus)
router.get("/:id/download-config", protect, adminOnly, getProductDownloadConfig)
router.get("/:id", getProduct)
router.post("/", protect, adminOnly, createProduct)
router.put("/:id", protect, adminOnly, updateProduct)
router.delete("/:id", protect, adminOnly, deleteProduct)

export default router
