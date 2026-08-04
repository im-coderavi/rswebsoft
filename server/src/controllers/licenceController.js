import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Licence from "../models/Licence.js"
import Product from "../models/Product.js"
import { recordLicenceAccess } from "../services/licenceService.js"

// Express sits behind a proxy in production, so prefer the forwarded address.
function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim()
  return req.ip || req.socket?.remoteAddress || ""
}

function toCustomerLicence(licence) {
  return {
    id: licence._id,
    key: licence.key,
    productName: licence.productName,
    status: licence.status,
    order: licence.order,
    accessCount: licence.accessCount,
    lastAccessAt: licence.lastAccessAt,
    createdAt: licence.createdAt,
  }
}

// Everything the signed-in customer owns. Never includes the file or password —
// those come only from the reveal call below, one licence at a time.
export const myLicences = asyncHandler(async (req, res) => {
  const licences = await Licence.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(licences.map(toCustomerLicence))
})

// The only route in the app that hands out a download link. Owner-only, active
// licences only, and it writes an access record every single time.
export const revealLicence = asyncHandler(async (req, res) => {
  const licence = await Licence.findOne({ key: String(req.params.key).toUpperCase() })

  // Same 404 whether the key is wrong or belongs to someone else — otherwise
  // this endpoint tells a stranger which keys exist.
  if (!licence || String(licence.user) !== String(req.user._id)) {
    throw new ApiError(404, "Licence not found")
  }

  if (licence.status === "revoked") {
    throw new ApiError(
      403,
      "This licence has been revoked. Contact support if you think that's a mistake."
    )
  }

  const product = await Product.findById(licence.product).select("+downloadUrl +downloadPassword name")
  if (!product?.downloadUrl?.trim()) {
    throw new ApiError(404, "This product has no file attached yet. Contact support.")
  }

  const updated = await recordLicenceAccess(licence, {
    ip: clientIp(req),
    userAgent: req.headers["user-agent"] ?? "",
  })

  res.json({
    key: licence.key,
    productName: licence.productName || product.name,
    downloadUrl: product.downloadUrl,
    downloadPassword: product.downloadPassword || "",
    accessCount: updated.accessCount,
  })
})

// ---- admin ----------------------------------------------------------------

export const listLicences = asyncHandler(async (req, res) => {
  const licences = await Licence.find()
    .sort({ createdAt: -1 })
    .populate("user", "name email userId")
    .limit(500)

  res.json(
    licences.map((l) => ({
      id: l._id,
      key: l.key,
      productName: l.productName,
      status: l.status,
      order: l.order,
      user: l.user,
      accessCount: l.accessCount,
      distinctIpCount: l.distinctIps?.length ?? 0,
      lastAccessAt: l.lastAccessAt,
      revokedAt: l.revokedAt,
      revokedReason: l.revokedReason,
      createdAt: l.createdAt,
    }))
  )
})

export const getLicence = asyncHandler(async (req, res) => {
  const licence = await Licence.findById(req.params.id).populate("user", "name email userId phone")
  if (!licence) throw new ApiError(404, "Licence not found")
  res.json(licence)
})

export const setLicenceStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body
  if (!["active", "revoked"].includes(status)) throw new ApiError(400, "Invalid status")

  const licence = await Licence.findById(req.params.id)
  if (!licence) throw new ApiError(404, "Licence not found")

  licence.status = status
  licence.revokedAt = status === "revoked" ? new Date() : null
  licence.revokedReason = status === "revoked" ? String(reason ?? "").trim() : ""
  await licence.save()

  res.json(licence)
})
