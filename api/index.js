// Vercel serverless entry point — wraps the Express app so every /api/*
// request (per vercel.json's rewrite) is handled by this one function.
// Local dev still uses server/src/server.js (a normal long-running process);
// this file is only ever invoked in the Vercel runtime, where env vars come
// from the Vercel project settings (no dotenv needed).
import app from "../server/src/app.js"
import { connectDB } from "../server/src/config/db.js"

export default async function handler(req, res) {
  await connectDB()
  return app(req, res)
}
