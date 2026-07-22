import { asyncHandler } from "../utils/asyncHandler.js"
import Product from "../models/Product.js"
import Category from "../models/Category.js"
import Brand from "../models/Brand.js"
import Order from "../models/Order.js"
import User from "../models/User.js"

export const getStats = asyncHandler(async (req, res) => {
  const [products, categories, brands, orders, users, publishedProducts] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Brand.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments({ status: "published" }),
  ])

  res.json({ products, categories, brands, orders, users, publishedProducts })
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
