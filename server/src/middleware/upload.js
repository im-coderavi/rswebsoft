import multer from "multer"

const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith("image/")) return cb(null, true)
  cb(new Error("Only image files are allowed"))
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})
