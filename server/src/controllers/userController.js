import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import User from "../models/User.js"
import Order from "../models/Order.js"

function toCustomerSummary(user, stats) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    orderCount: stats?.orderCount || 0,
    totalSpent: stats?.totalSpent || 0,
  }
}

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "user" }).sort({ createdAt: -1 })
  const stats = await Order.aggregate([
    { $match: { user: { $ne: null } } },
    { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
  ])
  const statsByUser = new Map(stats.map((s) => [String(s._id), s]))
  res.json(users.map((u) => toCustomerSummary(u, statsByUser.get(String(u._id)))))
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: "user" })
  if (!user) throw new ApiError(404, "Customer not found")

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 })
  res.json({
    user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    orders,
  })
})
