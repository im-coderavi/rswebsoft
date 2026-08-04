import { Router } from "express"
import {
  myLicences,
  revealLicence,
  listLicences,
  getLicence,
  setLicenceStatus,
} from "../controllers/licenceController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

// Customer — signing in is the whole point, so nothing here is public.
router.get("/mine", protect, myLicences)
router.post("/:key/reveal", protect, revealLicence)

// Admin
router.get("/", protect, adminOnly, listLicences)
router.get("/:id", protect, adminOnly, getLicence)
router.patch("/:id/status", protect, adminOnly, setLicenceStatus)

export default router
