import { Router } from "express"
import {
  myLicences,
  unlockLicence,
  createOpenToken,
  openLicenceFile,
  listLicences,
  getLicence,
  setLicenceStatus,
  setDeviceStatus,
} from "../controllers/licenceController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

// Unauthenticated by design — a browser navigation can't send a bearer token,
// so the single-use 60-second ticket in the path is the credential. Declared
// before "/:id" so "open" is never read as an id.
router.get("/open/:token", openLicenceFile)

// Customer
router.get("/mine", protect, myLicences)
router.post("/unlock", protect, unlockLicence)
router.post("/open-token", protect, createOpenToken)

// Admin
router.get("/", protect, adminOnly, listLicences)
router.get("/:id", protect, adminOnly, getLicence)
router.patch("/:id/status", protect, adminOnly, setLicenceStatus)
router.patch("/:id/devices/:deviceId", protect, adminOnly, setDeviceStatus)

export default router
