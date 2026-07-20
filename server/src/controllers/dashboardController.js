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
