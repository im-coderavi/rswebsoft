import crypto from "crypto"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Licence from "../models/Licence.js"
import Product from "../models/Product.js"
import { recordLicenceAccess, authoriseDevice } from "../services/licenceService.js"

// The open ticket only has to survive the round trip from clicking the button
// to the browser following the redirect.
const OPEN_TOKEN_TTL_MS = 60 * 1000

// Express sits behind a proxy in production, so prefer the forwarded address.
function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim()
  return req.ip || req.socket?.remoteAddress || ""
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex")
}

// RSW-8F3K-2MQP-XZ47 -> RSW-••••-••••-XZ47
// Enough for the customer to tell two licences apart, not enough to unlock one.
// The full key lives in their delivery email, which is the second thing an
// attacker would need on top of the account password.
function maskKey(key) {
  const groups = key.split("-")
  if (groups.length < 4) return key
  return [groups[0], "••••", "••••", groups.at(-1)].join("-")
}

function toCustomerLicence(licence) {
  return {
    id: licence._id,
    maskedKey: maskKey(licence.key),
    productName: licence.productName,
    status: licence.status,
    order: licence.order,
    accessCount: licence.accessCount,
    lastAccessAt: licence.lastAccessAt,
    createdAt: licence.createdAt,
  }
}

// Everything the signed-in customer owns — masked keys only, and never the
// file or its password. Those need the full key, via unlock below.
export const myLicences = asyncHandler(async (req, res) => {
  const licences = await Licence.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(licences.map(toCustomerLicence))
})

// Finds a licence the caller is allowed to use, or throws. Deliberately the
// same 404 whether the key is wrong or belongs to someone else — otherwise
// this tells a stranger which keys exist.
async function requireOwnedLicence(req, key) {
  const licence = await Licence.findOne({ key: String(key ?? "").trim().toUpperCase() })

  if (!licence || String(licence.user) !== String(req.user._id)) {
    throw new ApiError(404, "That licence key doesn't match anything on your account")
  }
  if (licence.status === "revoked") {
    throw new ApiError(
      403,
      "This licence has been revoked. Contact support if you think that's a mistake."
    )
  }
  return licence
}

// Runs the device gate and turns a refusal into the response the customer sees.
// Both unlock and the open ticket go through this, so an approved tab can't be
// used to keep fetching tickets for a machine that was later denied.
async function requireApprovedDevice(req, licence) {
  const { allowed, status } = await authoriseDevice(licence, {
    deviceId: req.body.deviceId,
    ip: clientIp(req),
    userAgent: req.headers["user-agent"] ?? "",
  })

  if (allowed) return

  if (status === "unidentified") {
    throw new ApiError(400, "Couldn't identify this device. Enable site data for this browser and try again.")
  }
  if (status === "denied") {
    throw new ApiError(
      403,
      "This device isn't allowed to open your download. Contact the shop if you think that's wrong."
    )
  }
  // pending
  throw new ApiError(
    403,
    "This is a new device, so the shop has to approve it first. We've sent them the request."
  )
}

// Unlocks a product with the key from the delivery email. Returns the password
// the customer has to type into the file host — but NOT the download URL. That
// is only ever reachable through the redirect below, so there is no link in
// the page to right-click and copy.
export const unlockLicence = asyncHandler(async (req, res) => {
  const licence = await requireOwnedLicence(req, req.body.key)
  await requireApprovedDevice(req, licence)

  const product = await Product.findById(licence.product).select("+downloadUrl +downloadPassword name")
  if (!product?.downloadUrl?.trim()) {
    throw new ApiError(404, "This product has no file attached yet. Contact support.")
  }

  const updated = await recordLicenceAccess(licence, {
    ip: clientIp(req),
    userAgent: req.headers["user-agent"] ?? "",
  })

  res.json({
    id: licence._id,
    productName: licence.productName || product.name,
    downloadPassword: product.downloadPassword || "",
    accessCount: updated.accessCount,
  })
})

// Mints the single-use ticket the browser will navigate to. Called with the
// full key, so an unlocked tab can keep opening the file without re-entering it.
export const createOpenToken = asyncHandler(async (req, res) => {
  const licence = await requireOwnedLicence(req, req.body.key)
  await requireApprovedDevice(req, licence)

  const raw = crypto.randomBytes(32).toString("hex")
  licence.openToken = hashToken(raw)
  licence.openTokenExpires = new Date(Date.now() + OPEN_TOKEN_TTL_MS)
  await licence.save()

  res.json({ token: raw })
})

// No auth middleware on purpose: this is a top-level browser navigation, which
// cannot carry an Authorization header. The single-use, 60-second token is the
// credential, and it is burned before the redirect goes out.
export const openLicenceFile = asyncHandler(async (req, res) => {
  const licence = await Licence.findOne({
    openToken: hashToken(String(req.params.token)),
    openTokenExpires: { $gt: new Date() },
  }).select("+openToken +openTokenExpires")

  if (!licence) throw new ApiError(400, "This download link has expired. Open it from your account again.")

  licence.openToken = null
  licence.openTokenExpires = null
  await licence.save()

  if (licence.status === "revoked") {
    throw new ApiError(403, "This licence has been revoked.")
  }

  const product = await Product.findById(licence.product).select("+downloadUrl")
  if (!product?.downloadUrl?.trim()) throw new ApiError(404, "This product has no file attached yet.")

  await recordLicenceAccess(licence, {
    ip: clientIp(req),
    userAgent: req.headers["user-agent"] ?? "",
  })

  res.redirect(302, product.downloadUrl)
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
      pendingDeviceCount: (l.devices ?? []).filter((d) => d.status === "pending").length,
      approvedDeviceCount: (l.devices ?? []).filter((d) => d.status === "approved").length,
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

export const setDeviceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!["approved", "denied"].includes(status)) throw new ApiError(400, "Invalid status")

  const licence = await Licence.findById(req.params.id)
  if (!licence) throw new ApiError(404, "Licence not found")

  const device = licence.devices?.find((d) => d.deviceId === req.params.deviceId)
  if (!device) throw new ApiError(404, "Device not found on this licence")

  device.status = status
  device.decidedAt = new Date()
  await licence.save()

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
