import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import cloudinary from "../config/cloudinary.js"

const ALLOWED_FOLDERS = {
  products: "rswebsoft/products",
  brands: "rswebsoft/brands",
}

function streamUpload(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => (error ? reject(error) : resolve(result))
    )
    stream.end(buffer)
  })
}

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided")

  const folder = ALLOWED_FOLDERS[req.body.folder] || ALLOWED_FOLDERS.products
  const result = await streamUpload(req.file.buffer, folder)
  res.status(201).json({ url: result.secure_url, publicId: result.public_id })
})
