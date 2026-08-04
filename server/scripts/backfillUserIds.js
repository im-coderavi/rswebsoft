import "dotenv/config"
import mongoose from "mongoose"
import User from "../src/models/User.js"
import { generateUserId } from "../src/utils/generateUserId.js"

// Idempotent: only touches users that have no userId, so re-running is safe.
async function run() {
  await mongoose.connect(process.env.MONGODB_URI)

  const pending = await User.find({ $or: [{ userId: { $exists: false } }, { userId: null }] })
  console.log(`${pending.length} user(s) need a userId`)

  let updated = 0
  for (const user of pending) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateUserId()
      if (await User.exists({ userId: candidate })) continue
      user.userId = candidate
      // These documents predate the new fields and may not satisfy every
      // validator; this script's only job is to add an ID.
      await user.save({ validateBeforeSave: false })
      console.log(`  ${user.email} -> ${candidate}`)
      updated++
      break
    }
  }

  console.log(`Done. ${updated} updated.`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
