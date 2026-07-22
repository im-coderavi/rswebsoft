import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import Subscriber from "../models/Subscriber.js"

export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) throw new ApiError(400, "Email is required")

  const existing = await Subscriber.findOne({ email: email.toLowerCase() })
  if (existing) return res.json({ message: "You're already subscribed" })

  await Subscriber.create({ email: email.toLowerCase() })
  res.status(201).json({ message: "Subscribed" })
})

export const listSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 })
  res.json(subscribers)
})

export const deleteSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findByIdAndDelete(req.params.id)
  if (!subscriber) throw new ApiError(404, "Subscriber not found")
  res.json({ message: "Subscriber deleted" })
})
