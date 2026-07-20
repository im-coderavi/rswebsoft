export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500
  let message = err.message || "Server error"

  if (err.name === "ValidationError") {
    statusCode = 400
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ")
  }
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0]
    message = `${field ? field[0].toUpperCase() + field.slice(1) : "Value"} already exists`
  }
  if (err.name === "CastError") {
    statusCode = 400
    message = `Invalid ${err.path}`
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err)
  }

  res.status(statusCode).json({ message })
}
