import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import DeliveredWebsiteSetting from "../models/DeliveredWebsiteSetting.js"

// Turns whatever the admin typed into the digits-with-country-code form that
// wa.me needs. Accepts "9876543210", "+91 98765 43210", "0 98765 43210".
// Returns null if it can't be read as an Indian mobile number.
function toWhatsappNumber(raw) {
  if (typeof raw !== "string") return null

  let digits = raw.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1)
  if (digits.length === 10) digits = `91${digits}`

  if (digits.length !== 12 || !digits.startsWith("91")) return null
  if (!/^[6-9]/.test(digits.slice(2))) return null

  return digits
}

export const getDeliveredWebsiteSettings = asyncHandler(async (req, res) => {
  const settings =
    (await DeliveredWebsiteSetting.findOne()) || (await DeliveredWebsiteSetting.create({}))
  res.json(settings)
})

export const updateDeliveredWebsiteSettings = asyncHandler(async (req, res) => {
  const { whatsappNumber } = req.body

  // An empty value is how the admin turns the Contact button off again.
  let normalized = ""
  if (whatsappNumber?.trim()) {
    normalized = toWhatsappNumber(whatsappNumber)
    if (!normalized) throw new ApiError(400, "Enter a valid 10-digit Indian mobile number")
  }

  const settings = await DeliveredWebsiteSetting.findOneAndUpdate(
    {},
    { whatsappNumber: normalized },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  res.json(settings)
})
