import express from "express"
import cors from "cors"
import morgan from "morgan"

import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import brandRoutes from "./routes/brandRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import paymentSettingRoutes from "./routes/paymentSettingRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import demoLinkRoutes from "./routes/demoLinkRoutes.js"
import subscriberRoutes from "./routes/subscriberRoutes.js"
import homeSectionRoutes from "./routes/homeSectionRoutes.js"
import { notFound, errorHandler } from "./middleware/errorHandler.js"

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || "*" }))
app.use(express.json())
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"))

app.get("/api/health", (req, res) => res.json({ ok: true }))

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/brands", brandRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/payment-settings", paymentSettingRoutes)
app.use("/api/users", userRoutes)
app.use("/api/demo-links", demoLinkRoutes)
app.use("/api/subscribers", subscriberRoutes)
app.use("/api/home-sections", homeSectionRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
