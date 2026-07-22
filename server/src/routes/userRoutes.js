import { Router } from "express"
import { listUsers, getUser } from "../controllers/userController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listUsers)
router.get("/:id", protect, adminOnly, getUser)

export default router
