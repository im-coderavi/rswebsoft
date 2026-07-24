import { asyncHandler } from "../utils/asyncHandler.js"
import PaymentSetting from "../models/PaymentSetting.js"

export const getPaymentSettings = asyncHandler(async (req, res) => {
  const settings = (await PaymentSetting.findOne()) || (await PaymentSetting.create({}))
  res.json(settings)
})

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const { upiId, payeeName, qrImage, note, whatsappNumber } = req.body
  const settings = await PaymentSetting.findOneAndUpdate(
    {},
    { upiId, payeeName, qrImage, note, whatsappNumber },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  res.json(settings)
})
