import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import DemoLink from "../models/DemoLink.js"

export const listDemoLinks = asyncHandler(async (req, res) => {
  const links = await DemoLink.find().sort({ order: 1, createdAt: 1 })
  res.json(links)
})

export const createDemoLink = asyncHandler(async (req, res) => {
  const link = await DemoLink.create(req.body)
  res.status(201).json(link)
})

export const updateDemoLink = asyncHandler(async (req, res) => {
  const link = await DemoLink.findById(req.params.id)
  if (!link) throw new ApiError(404, "Demo link not found")

  Object.assign(link, req.body)
  await link.save()
  res.json(link)
})

export const deleteDemoLink = asyncHandler(async (req, res) => {
  const link = await DemoLink.findByIdAndDelete(req.params.id)
  if (!link) throw new ApiError(404, "Demo link not found")
  res.json({ message: "Demo link deleted" })
})
