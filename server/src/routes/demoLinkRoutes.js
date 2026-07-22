import { Router } from "express"
import {
  listDemoLinks,
  createDemoLink,
  updateDemoLink,
  deleteDemoLink,
} from "../controllers/demoLinkController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", listDemoLinks)
router.post("/", protect, adminOnly, createDemoLink)
router.put("/:id", protect, adminOnly, updateDemoLink)
router.delete("/:id", protect, adminOnly, deleteDemoLink)

export default router
