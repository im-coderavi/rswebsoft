// Vercel serverless entry point — wraps the Express app so every /api/*
// request (per vercel.json's rewrite) is handled by this one function.
// Local dev still uses server/src/server.js (a normal long-running process);
// this file is only ever invoked in the Vercel runtime, where env vars come
// from the Vercel project settings (no dotenv needed).
import app from "../server/src/app.js"
import { connectDB } from "../server/src/config/db.js"
import { warnIfClientUrlLooksWrong } from "../server/src/utils/clientUrl.js"

// Runs once per cold start, not per request. This is the only entry point in
// production, so the CLIENT_URL check has to live here as well as in
// server.js — it shipped pointing at localhost, which silently broke every
// link in every email including password reset.
warnIfClientUrlLooksWrong()

export default async function handler(req, res) {
  await connectDB()
  return app(req, res)
}
