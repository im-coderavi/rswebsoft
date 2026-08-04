import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import NotificationSetting from "../models/NotificationSetting.js"
import { sendTestWhatsapp, toWhatsappNumber } from "../services/whatsappService.js"

// Admin only, always — this document holds an API key and the owner's own
// phone number, neither of which belongs in a public response.
export const getNotificationSettings = asyncHandler(async (req, res) => {
  const settings = (await NotificationSetting.findOne()) || (await NotificationSetting.create({}))
  res.json(settings)
})

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { whatsappEnabled, whatsappPhone, whatsappApiKey } = req.body

  const update = { whatsappEnabled: Boolean(whatsappEnabled) }

  if (whatsappPhone !== undefined) {
    if (String(whatsappPhone).trim()) {
      const normalized = toWhatsappNumber(String(whatsappPhone))
      if (!normalized) throw new ApiError(400, "Enter a valid phone number with country code")
      update.whatsappPhone = normalized
    } else {
      update.whatsappPhone = ""
    }
  }

  if (whatsappApiKey !== undefined) update.whatsappApiKey = String(whatsappApiKey).trim()

  if (update.whatsappEnabled && !(update.whatsappPhone ?? (await NotificationSetting.findOne())?.whatsappPhone)) {
    throw new ApiError(400, "Add the number before switching alerts on")
  }

  const settings = await NotificationSetting.findOneAndUpdate({}, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  })

  res.json(settings)
})

export const testNotification = asyncHandler(async (req, res) => {
  const result = await sendTestWhatsapp()
  if (!result.ok) {
    throw new ApiError(
      400,
      result.error === "disabled"
        ? "Switch WhatsApp alerts on and save before sending a test"
        : `Couldn't send: ${result.error}`
    )
  }
  res.json({ message: "Test message sent — check your WhatsApp" })
})
