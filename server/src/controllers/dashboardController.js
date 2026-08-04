import { asyncHandler } from "../utils/asyncHandler.js"
import Product from "../models/Product.js"
import Category from "../models/Category.js"
import Brand from "../models/Brand.js"
import Order from "../models/Order.js"
import User from "../models/User.js"
import DemoLink from "../models/DemoLink.js"
import Subscriber from "../models/Subscriber.js"

const REVENUE_STATUSES = ["paid", "fulfilled"]

export const getStats = asyncHandler(async (req, res) => {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const weekAgo = new Date(now.getTime() - 7 * dayMs)
  const twoWeeksAgo = new Date(now.getTime() - 14 * dayMs)

  const [
    products,
    categories,
    brands,
    orders,
    users,
    publishedProducts,
    customers,
    demoLinks,
    subscribers,
    revenueAgg,
    revenueThisWeekAgg,
    revenueLastWeekAgg,
    ordersThisWeek,
    ordersLastWeek,
  ] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Brand.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments({ status: "published" }),
    User.countDocuments({ role: "user" }),
    DemoLink.countDocuments(),
    Subscriber.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: weekAgo } }),
    Order.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
  ])

  const revenue = revenueAgg[0]?.total ?? 0
  const revenueThisWeek = revenueThisWeekAgg[0]?.total ?? 0
  const revenueLastWeek = revenueLastWeekAgg[0]?.total ?? 0

  const pctChange = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  res.json({
    products,
    categories,
    brands,
    orders,
    users,
    publishedProducts,
    customers,
    demoLinks,
    subscribers,
    revenue,
    revenueTrend: pctChange(revenueThisWeek, revenueLastWeek),
    ordersTrend: pctChange(ordersThisWeek, ordersLastWeek),
  })
})

export const getAnalytics = asyncHandler(async (req, res) => {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const rangeStart = new Date(now.getTime() - 29 * dayMs)
  rangeStart.setHours(0, 0, 0, 0)

  const [revenueByDay, statusBreakdown, topProducts, recentOrders] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(8).select("customer total status createdAt"),
  ])

  const byDate = new Map(revenueByDay.map((d) => [d._id, d.revenue]))
  const revenueTrend = []
  for (let offset = 0; offset <= 29; offset++) {
    const key = new Date(rangeStart.getTime() + offset * dayMs).toISOString().slice(0, 10)
    revenueTrend.push({ date: key, revenue: byDate.get(key) ?? 0 })
  }

  res.json({
    revenueTrend,
    statusBreakdown: statusBreakdown.map((s) => ({ status: s._id, count: s.count })),
    topProducts: topProducts.map((p) => ({ id: p._id, name: p.name, qty: p.qty, revenue: p.revenue })),
    recentOrders: recentOrders.map((o) => ({
      id: o._id,
      customerName: o.customer?.name || "—",
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    })),
  })
})

// Public — safe aggregate counts only, no sensitive data. Powers the
// storefront's homepage stats strip.
export const getPublicStats = asyncHandler(async (req, res) => {
  const [products, categories, brands, customers] = await Promise.all([
    Product.countDocuments({ status: "published" }),
    Category.countDocuments(),
    Brand.countDocuments(),
    User.countDocuments({ role: "user" }),
  ])

  res.json({ products, categories, brands, customers })
})
