import mongoose from "mongoose"

// Cached across invocations so repeated Vercel serverless cold/warm starts
// reuse one connection instead of reconnecting on every request.
let connectionPromise = null

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection

  if (!connectionPromise) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error("MONGODB_URI is not set")

    mongoose.set("strictQuery", true)
    connectionPromise = mongoose.connect(uri).then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
      return conn.connection
    })
  }

  return connectionPromise
}
