import { Router } from "express"
import {
  listPublicHomeSections,
  listAdminHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  reorderHomeSections,
} from "../controllers/homeSectionController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", listPublicHomeSections)
router.get("/admin", protect, adminOnly, listAdminHomeSections)
router.post("/", protect, adminOnly, createHomeSection)
router.patch("/reorder", protect, adminOnly, reorderHomeSections)
router.put("/:id", protect, adminOnly, updateHomeSection)
router.delete("/:id", protect, adminOnly, deleteHomeSection)

export default router
