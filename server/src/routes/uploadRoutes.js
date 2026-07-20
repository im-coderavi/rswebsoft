import { Router } from "express"
import { uploadImage } from "../controllers/uploadController.js"
import { protect, adminOnly } from "../middleware/auth.js"
import { upload } from "../middleware/upload.js"

const router = Router()

router.post("/", protect, adminOnly, upload.single("image"), uploadImage)

export default router
