# Auth Core (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every customer a quotable `RSW-XXXXXX` User ID, let them sign up with a phone number, log in with email/phone/User ID, recover a forgotten password by email, and stay logged in for 30 days with automatic renewal.

**Architecture:** Two pure utility modules (`normalizePhone`, `generateUserId`) are built and unit-tested first because everything else depends on their exact behaviour. The `User` model then gains four fields, JWTs gain a `tokenVersion` claim so a password change can revoke old sessions, and the auth controller grows from 3 endpoints to 7. On the frontend, `AuthContext` gains the new calls and four pages share one `AuthLayout` shell.

**Tech Stack:** Node 24 (ESM), Express 4, Mongoose 8, jsonwebtoken 9, bcryptjs 2, nodemailer 9, React 19, react-router 7, TanStack Query 5, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-04-auth-core-phase1-design.md`

## Global Constraints

- **Node's built-in test runner (`node --test`) is the test tool.** No test framework is installed and none is to be added — Node 24 ships one. Server tests live beside their subject as `*.test.js`.
- **No new npm dependencies.** Everything needed (`crypto`, `jsonwebtoken`, `bcryptjs`, `nodemailer`) is already present.
- **Never email a password.** The welcome email carries the User ID only. This is a spec-level security decision, not a style preference.
- **`POST /auth/forgot-password` always returns HTTP 200** with the same body, whether or not the identifier matched an account.
- **`POST /auth/login` always fails with exactly `"Invalid credentials"`** — never a message that distinguishes unknown identifier from wrong password.
- **Reset tokens are stored as SHA-256 hashes**, never in plaintext. Expiry is 1 hour. Single use.
- **`phone` and `userId` are `unique: true, sparse: true`** and are NOT `required` at the schema level — existing users lack them and a schema requirement would break `.save()` on those documents.
- **Phone normalisation is India-only** (10 digits after stripping `+91`/`91`/leading `0`), matching the INR/UPI-only storefront.
- User ID alphabet excludes `0`, `1`, `O`, `I`, `L`.
- Existing sessions must survive the deploy: treat a missing `tv` claim and a missing `tokenVersion` field as `0`.
- ESM only (`"type": "module"`) — use `import`, never `require`.

---

### Task 1: Phone normalisation utility

**Files:**
- Create: `server/src/utils/normalizePhone.js`
- Test: `server/src/utils/normalizePhone.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `normalizePhone(raw: string) => string | null` — returns a 10-digit string, or `null` if the input cannot be reduced to a valid Indian 10-digit number. Used by Tasks 5, 6 and 7.

- [ ] **Step 1: Write the failing test**

Create `server/src/utils/normalizePhone.test.js`:

```javascript
import test from "node:test"
import assert from "node:assert/strict"
import { normalizePhone } from "./normalizePhone.js"

test("keeps a plain 10-digit number", () => {
  assert.equal(normalizePhone("9876543210"), "9876543210")
})

test("strips spaces, dashes and brackets", () => {
  assert.equal(normalizePhone("98765-43210"), "9876543210")
  assert.equal(normalizePhone("98765 43210"), "9876543210")
  assert.equal(normalizePhone("(98765) 43210"), "9876543210")
})

test("strips a +91 country code", () => {
  assert.equal(normalizePhone("+919876543210"), "9876543210")
  assert.equal(normalizePhone("+91 98765 43210"), "9876543210")
  assert.equal(normalizePhone("919876543210"), "9876543210")
})

test("strips a leading zero", () => {
  assert.equal(normalizePhone("09876543210"), "9876543210")
})

test("rejects numbers that are too short or too long", () => {
  assert.equal(normalizePhone("98765"), null)
  assert.equal(normalizePhone("98765432109876"), null)
})

test("rejects empty and non-string input", () => {
  assert.equal(normalizePhone(""), null)
  assert.equal(normalizePhone(null), null)
  assert.equal(normalizePhone(undefined), null)
  assert.equal(normalizePhone(1234567890), null)
})

test("rejects a 10-digit number that cannot start an Indian mobile", () => {
  // Indian mobile numbers start 6-9. A 10-digit string starting 0-5 is not one.
  assert.equal(normalizePhone("1234567890"), null)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && node --test src/utils/normalizePhone.test.js`
Expected: FAIL — `Cannot find module .../normalizePhone.js`

- [ ] **Step 3: Write minimal implementation**

Create `server/src/utils/normalizePhone.js`:

```javascript
// The storefront is India-only (INR prices, UPI payments), so a valid phone
// here is a 10-digit Indian mobile number. Customers type it in many shapes —
// "+91 98765 43210", "098765-43210", "9876543210" — and all of them must
// resolve to the same stored value, otherwise phone login silently fails for
// anyone who types it differently than they did at signup.
//
// If the shop ever sells outside India, this is the only function to change.
export function normalizePhone(raw) {
  if (typeof raw !== "string") return null

  let digits = raw.replace(/\D/g, "")

  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1)

  if (digits.length !== 10) return null
  if (!/^[6-9]/.test(digits)) return null

  return digits
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && node --test src/utils/normalizePhone.test.js`
Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/normalizePhone.js server/src/utils/normalizePhone.test.js
git commit -m "feat(auth): add India phone normalisation utility"
```

---

### Task 2: User ID generation utility

**Files:**
- Create: `server/src/utils/generateUserId.js`
- Test: `server/src/utils/generateUserId.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `USER_ID_ALPHABET: string` — the 31-character alphabet, exported for the test.
  - `generateUserId() => string` — one ID, format `RSW-XXXXXX`.
  - `USER_ID_PATTERN: RegExp` — `/^RSW-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/`, used by Task 6 to decide whether an identifier looks like a User ID.

- [ ] **Step 1: Write the failing test**

Create `server/src/utils/generateUserId.test.js`:

```javascript
import test from "node:test"
import assert from "node:assert/strict"
import { generateUserId, USER_ID_ALPHABET, USER_ID_PATTERN } from "./generateUserId.js"

test("matches the RSW-XXXXXX shape", () => {
  assert.match(generateUserId(), /^RSW-[A-Z0-9]{6}$/)
})

test("excludes ambiguous characters from the alphabet", () => {
  for (const char of ["0", "1", "O", "I", "L"]) {
    assert.equal(USER_ID_ALPHABET.includes(char), false, `alphabet must not contain ${char}`)
  }
  assert.equal(USER_ID_ALPHABET.length, 31)
})

test("only ever emits characters from the alphabet", () => {
  for (let i = 0; i < 500; i++) {
    const body = generateUserId().slice(4)
    for (const char of body) {
      assert.ok(USER_ID_ALPHABET.includes(char), `unexpected character ${char}`)
    }
  }
})

test("USER_ID_PATTERN accepts generated ids and rejects near-misses", () => {
  assert.match(generateUserId(), USER_ID_PATTERN)
  assert.doesNotMatch("RSW-8F3K2", USER_ID_PATTERN)      // too short
  assert.doesNotMatch("RSW-8F3K2MM", USER_ID_PATTERN)    // too long
  assert.doesNotMatch("RSW-8F3K2O", USER_ID_PATTERN)     // ambiguous char
  assert.doesNotMatch("rsw-8F3K2M", USER_ID_PATTERN)     // lowercase prefix
  assert.doesNotMatch("8F3K2M", USER_ID_PATTERN)         // no prefix
})

test("does not collide across a large sample", () => {
  const seen = new Set()
  for (let i = 0; i < 5000; i++) seen.add(generateUserId())
  assert.equal(seen.size, 5000)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && node --test src/utils/generateUserId.test.js`
Expected: FAIL — `Cannot find module .../generateUserId.js`

- [ ] **Step 3: Write minimal implementation**

Create `server/src/utils/generateUserId.js`:

```javascript
import { randomInt } from "crypto"

// Customers read this ID aloud to support and copy it off screenshots, so the
// alphabet drops every character that is ambiguous in that setting:
// 0/O, 1/I/L. 31 usable characters ^ 6 places is ~887 million combinations.
export const USER_ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
const ID_LENGTH = 6
const PREFIX = "RSW-"

export const USER_ID_PATTERN = new RegExp(`^${PREFIX}[${USER_ID_ALPHABET}]{${ID_LENGTH}}$`)

export function generateUserId() {
  let body = ""
  for (let i = 0; i < ID_LENGTH; i++) {
    body += USER_ID_ALPHABET[randomInt(USER_ID_ALPHABET.length)]
  }
  return PREFIX + body
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && node --test src/utils/generateUserId.test.js`
Expected: PASS — 5 tests passing.

- [ ] **Step 5: Add a test script and run the whole suite**

Add to `server/package.json` `scripts`, after `"start"`:

```json
    "test": "node --test \"src/**/*.test.js\"",
```

Run: `cd server && npm test`
Expected: PASS — 12 tests across both files.

- [ ] **Step 6: Commit**

```bash
git add server/src/utils/generateUserId.js server/src/utils/generateUserId.test.js server/package.json
git commit -m "feat(auth): add user ID generator and npm test script"
```

---

### Task 3: Extend the User model

**Files:**
- Modify: `server/src/models/User.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `User` documents with `userId`, `phone`, `tokenVersion`, `passwordResetToken`, `passwordResetExpires`. Used by Tasks 4–9.

- [ ] **Step 1: Add the fields**

Replace the `userSchema` definition in `server/src/models/User.js` (keep the imports, the `pre("save")` hook, `comparePassword`, and the export exactly as they are):

```javascript
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatarUrl: { type: String, default: "" },

    // Short, human-quotable account number shown to the customer and accepted
    // as a login identifier. Sparse because accounts created before this
    // shipped have none until scripts/backfillUserIds.js runs.
    userId: { type: String, unique: true, sparse: true, uppercase: true, trim: true },

    // Stored normalised (10 digits, no country code) by normalizePhone.
    // NOT `required` at schema level: pre-existing users have no phone, and a
    // schema requirement would make every later .save() on them fail
    // validation — including an admin password change. The register
    // controller enforces it for new signups instead.
    phone: { type: String, unique: true, sparse: true, trim: true },

    // Bumped on every password change. `protect` compares it to the token's
    // `tv` claim, so changing a password signs out every other device.
    tokenVersion: { type: Number, default: 0 },

    // SHA-256 hash of the token that went out in the reset email — never the
    // raw token, so a leaked database dump cannot be used to take accounts.
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
)
```

- [ ] **Step 2: Verify the server still boots**

Run: `cd server && node --check src/models/User.js && node -e "import('./src/models/User.js').then(() => console.log('model loads OK'))"`
Expected: `model loads OK`

- [ ] **Step 3: Commit**

```bash
git add server/src/models/User.js
git commit -m "feat(auth): add userId, phone, tokenVersion and reset fields to User"
```

---

### Task 4: Token version in JWTs

**Files:**
- Modify: `server/src/utils/generateToken.js`
- Modify: `server/src/middleware/auth.js`

**Interfaces:**
- Consumes: `User.tokenVersion` from Task 3.
- Produces:
  - `generateToken(user) => string` — now signs `{ id, role, tv }`, 30-day default expiry.
  - `protect` rejects a token whose `tv` no longer matches the user's `tokenVersion`.

- [ ] **Step 1: Update the token signer**

Replace the whole of `server/src/utils/generateToken.js`:

```javascript
import jwt from "jsonwebtoken"

// `tv` carries the user's tokenVersion. `protect` compares it on every
// request, which is what makes "changing your password signs you out
// everywhere else" possible with stateless JWTs.
export function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, tv: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
  )
}
```

- [ ] **Step 2: Enforce it in the middleware**

In `server/src/middleware/auth.js`, replace the two lines that load the user (currently lines 20–21) with:

```javascript
  const user = await User.findById(payload.id)
  if (!user) throw new ApiError(401, "User no longer exists")

  // Tokens minted before this shipped carry no `tv`, and users created before
  // it have no `tokenVersion`. Both default to 0 so existing sessions survive
  // the deploy rather than everyone being signed out at once.
  if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new ApiError(401, "Session expired, please sign in again")
  }
```

- [ ] **Step 3: Verify both files parse**

Run: `cd server && node --check src/utils/generateToken.js && node --check src/middleware/auth.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Verify an existing session still works**

Start the server (`cd server && npm run dev`) in one terminal. In another:

```bash
cd server && node -e "
import('dotenv/config').then(async () => {
  const r = await fetch('http://localhost:5000/api/auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
  })
  const j = await r.json()
  console.log('login:', r.status)
  const me = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: 'Bearer ' + j.token } })
  console.log('me:', me.status, JSON.stringify(await me.json()))
})
"
```

Expected: `login: 200` then `me: 200` with the admin user. (Login here still uses `email` — Task 6 changes that.)

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/generateToken.js server/src/middleware/auth.js
git commit -m "feat(auth): add tokenVersion claim and 30-day default expiry"
```

---

### Task 5: Welcome email

**Files:**
- Create: `server/src/templates/emails/welcome.html`
- Modify: `server/src/services/mailService.js`

**Interfaces:**
- Consumes: `renderTemplate`, `escapeHtml`, `transporter`, `mailFrom` (all already imported at the top of `mailService.js`).
- Produces: `sendWelcomeEmail(user) => Promise<{ ok: boolean, error?: string }>` where `user` has `{ name, email, userId }`. Used by Task 7.

- [ ] **Step 1: Create the template**

Create `server/src/templates/emails/welcome.html`:

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#4f46e5;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Welcome to RSWebSoft</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 4px;color:#334155;font-size:14px;">Hi {{customerName}},</p>
                <p style="margin:0 0 20px;color:#334155;font-size:14px;">Your account is ready. Here is your customer ID — keep it handy, support will ask for it.</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                  <tr>
                    <td align="center" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:18px;">
                      <div style="font-size:12px;color:#64748b;letter-spacing:1px;text-transform:uppercase;">Your User ID</div>
                      <div style="margin-top:6px;font-size:24px;font-weight:bold;color:#0f172a;letter-spacing:2px;">{{userId}}</div>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 20px;color:#334155;font-size:14px;">You can sign in with any of these: your <strong>User ID</strong>, your <strong>email</strong> ({{customerEmail}}), or your <strong>phone number</strong> — whichever you remember.</p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
                  <tr>
                    <td style="background:#4f46e5;border-radius:6px;">
                      <a href="{{loginUrl}}" style="display:inline-block;padding:11px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Sign in</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">We never include your password in an email. If you forget it, use "Forgot password" on the sign-in page.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

- [ ] **Step 2: Add the service function**

Append to `server/src/services/mailService.js` (after `sendCustomerDeliveryEmail`):

```javascript
export async function sendWelcomeEmail(user) {
  try {
    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "")

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "welcome.html"), {
      customerName: escapeHtml(user.name),
      customerEmail: escapeHtml(user.email),
      userId: escapeHtml(user.userId),
      loginUrl: `${clientUrl}/login`,
    })

    await transporter.sendMail({
      from: mailFrom,
      to: user.email,
      subject: `Welcome to RSWebSoft — your User ID is ${user.userId}`,
      html,
    })

    return { ok: true }
  } catch (err) {
    console.error("sendWelcomeEmail failed:", err.message)
    return { ok: false, error: err.message }
  }
}
```

- [ ] **Step 3: Send one to yourself and check it**

```bash
cd server && cat > send-welcome.tmp.mjs <<'EOF'
import "dotenv/config"
import { sendWelcomeEmail } from "./src/services/mailService.js"
const r = await sendWelcomeEmail({
  name: "Test Customer",
  email: process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER,
  userId: "RSW-8F3K2M",
})
console.log(r)
EOF
node send-welcome.tmp.mjs; rm -f send-welcome.tmp.mjs
```

Expected: `{ ok: true }`. Open the inbox and confirm: the User ID block renders, the Sign in button points at `${CLIENT_URL}/login`, and **no password appears anywhere**.

- [ ] **Step 4: Commit**

```bash
git add server/src/templates/emails/welcome.html server/src/services/mailService.js
git commit -m "feat(auth): add welcome email carrying the user ID"
```

---

### Task 6: Password reset email

**Files:**
- Create: `server/src/templates/emails/passwordReset.html`
- Modify: `server/src/services/mailService.js`

**Interfaces:**
- Consumes: same helpers as Task 5.
- Produces: `sendPasswordResetEmail(user, rawToken) => Promise<{ ok: boolean, error?: string }>`. Used by Task 8.

- [ ] **Step 1: Create the template**

Create `server/src/templates/emails/passwordReset.html`:

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#4f46e5;padding:20px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Reset your password</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 4px;color:#334155;font-size:14px;">Hi {{customerName}},</p>
                <p style="margin:0 0 20px;color:#334155;font-size:14px;">Use the button below to set a new password. This link works once and expires in one hour.</p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                  <tr>
                    <td style="background:#4f46e5;border-radius:6px;">
                      <a href="{{resetUrl}}" style="display:inline-block;padding:11px 22px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Set a new password</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 6px;color:#64748b;font-size:12px;">If the button doesn't work, paste this into your browser:</p>
                <p style="margin:0 0 20px;color:#4f46e5;font-size:12px;word-break:break-all;">{{resetUrl}}</p>

                <p style="margin:0;font-size:12px;color:#94a3b8;">Didn't ask for this? Ignore this email — your password stays as it is.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

- [ ] **Step 2: Add the service function**

Append to `server/src/services/mailService.js`:

```javascript
export async function sendPasswordResetEmail(user, rawToken) {
  try {
    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/$/, "")
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`

    const html = await renderTemplate(path.join(TEMPLATES_DIR, "passwordReset.html"), {
      customerName: escapeHtml(user.name),
      resetUrl,
    })

    await transporter.sendMail({
      from: mailFrom,
      to: user.email,
      subject: "Reset your RSWebSoft password",
      html,
    })

    return { ok: true }
  } catch (err) {
    console.error("sendPasswordResetEmail failed:", err.message)
    return { ok: false, error: err.message }
  }
}
```

- [ ] **Step 3: Send one to yourself and check it**

```bash
cd server && cat > send-reset.tmp.mjs <<'EOF'
import "dotenv/config"
import { sendPasswordResetEmail } from "./src/services/mailService.js"
const r = await sendPasswordResetEmail(
  { name: "Test Customer", email: process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER },
  "sampletoken123"
)
console.log(r)
EOF
node send-reset.tmp.mjs; rm -f send-reset.tmp.mjs
```

Expected: `{ ok: true }`, and the mail's link reads `${CLIENT_URL}/reset-password/sampletoken123`.

- [ ] **Step 4: Commit**

```bash
git add server/src/templates/emails/passwordReset.html server/src/services/mailService.js
git commit -m "feat(auth): add password reset email"
```

---

### Task 7: Register with phone and User ID

**Files:**
- Modify: `server/src/controllers/authController.js`

**Interfaces:**
- Consumes: `generateUserId` (Task 2), `normalizePhone` (Task 1), `sendWelcomeEmail` (Task 5), `User` (Task 3), `generateToken` (Task 4).
- Produces: `toPublicUser(user)` now returns `{ id, userId, name, email, phone, role, avatarUrl }` — the frontend in Tasks 10–13 relies on `userId` and `phone` being present.

- [ ] **Step 1: Update imports and `toPublicUser`**

Replace the top of `server/src/controllers/authController.js` (the imports and `toPublicUser`) with:

```javascript
import crypto from "crypto"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { generateToken } from "../utils/generateToken.js"
import { generateUserId, USER_ID_PATTERN } from "../utils/generateUserId.js"
import { normalizePhone } from "../utils/normalizePhone.js"
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/mailService.js"
import User from "../models/User.js"

function toPublicUser(user) {
  return {
    id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
  }
}

// Retries on the unique-index race: two concurrent signups can generate the
// same ID, and the loser must get a different one rather than a 500.
async function createUserWithUniqueId(fields) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await User.create({ ...fields, userId: generateUserId() })
    } catch (err) {
      const isDuplicateUserId = err?.code === 11000 && err?.keyPattern?.userId
      if (!isDuplicateUserId) throw err
    }
  }
  throw new ApiError(500, "Could not allocate a user ID, please try again")
}
```

- [ ] **Step 2: Replace `register`**

Replace the existing `register` export with:

```javascript
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body

  if (!name?.trim()) throw new ApiError(400, "Name is required")
  if (!email?.trim()) throw new ApiError(400, "Email is required")
  if (!phone?.trim()) throw new ApiError(400, "Phone number is required")
  if (!password) throw new ApiError(400, "Password is required")
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters")

  const normalizedPhone = normalizePhone(phone)
  if (!normalizedPhone) throw new ApiError(400, "Enter a valid 10-digit Indian mobile number")

  const normalizedEmail = email.toLowerCase().trim()

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "That email is already registered")
  }
  if (await User.exists({ phone: normalizedPhone })) {
    throw new ApiError(409, "That phone number is already registered")
  }

  const user = await createUserWithUniqueId({
    name: name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
  })

  // A mail outage must not cost the customer their account — they are already
  // signed in, and can read the User ID off their account page.
  await sendWelcomeEmail(user)

  const token = generateToken(user)
  res.status(201).json({ token, user: toPublicUser(user) })
})
```

- [ ] **Step 3: Verify by registering a real account**

With the server running:

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Phase One Test","email":"phase1test@example.com","phone":"+91 98765 43210","password":"secret123"}' | head -c 400
```

Expected: HTTP 201 body containing `"userId":"RSW-…"` and `"phone":"9876543210"`.

Then confirm the duplicate paths:

```bash
curl -s -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Dup","email":"phase1test@example.com","phone":"9000000001","password":"secret123"}'
curl -s -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Dup","email":"other@example.com","phone":"98765 43210","password":"secret123"}'
curl -s -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Bad","email":"bad@example.com","phone":"12345","password":"secret123"}'
```

Expected in order: "That email is already registered", "That phone number is already registered", "Enter a valid 10-digit Indian mobile number".

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/authController.js
git commit -m "feat(auth): register with phone and generated user ID"
```

---

### Task 8: Login by email, phone or User ID

**Files:**
- Modify: `server/src/controllers/authController.js`

**Interfaces:**
- Consumes: `USER_ID_PATTERN`, `normalizePhone` (imported in Task 7).
- Produces: `POST /auth/login` accepting `{ identifier, password }`. Task 10's `AuthContext.login` sends exactly that key.

- [ ] **Step 1: Replace `login`**

Replace the existing `login` export with:

```javascript
// Build the narrowest $or that could match what the customer typed. Anything
// with an "@" is an email; RSW-XXXXXX is a user ID; ten digits is a phone.
// A typed value that looks like none of those matches nothing, which still
// falls through to the same generic 401.
function identifierQuery(identifier) {
  const trimmed = identifier.trim()
  const or = []

  if (trimmed.includes("@")) {
    or.push({ email: trimmed.toLowerCase() })
  }
  if (USER_ID_PATTERN.test(trimmed.toUpperCase())) {
    or.push({ userId: trimmed.toUpperCase() })
  }
  const phone = normalizePhone(trimmed)
  if (phone) {
    or.push({ phone })
  }

  return or
}

export const login = asyncHandler(async (req, res) => {
  // `email` is still accepted so the admin login page keeps working until it
  // is migrated; both map onto the same identifier resolution.
  const identifier = req.body.identifier ?? req.body.email
  const { password } = req.body

  if (!identifier || !password) throw new ApiError(400, "Enter your login details and password")

  const or = identifierQuery(String(identifier))

  // Deliberately identical failure for "no such account" and "wrong password".
  // Distinguishing them tells an attacker which emails and phone numbers are
  // registered here.
  const invalid = new ApiError(401, "Invalid credentials")
  if (or.length === 0) throw invalid

  const user = await User.findOne({ $or: or }).select("+password")
  if (!user || !(await user.comparePassword(password))) throw invalid

  const token = generateToken(user)
  res.json({ token, user: toPublicUser(user) })
})
```

- [ ] **Step 2: Verify all three identifiers work**

Using the account created in Task 7 (password `secret123`, User ID from that response):

```bash
for ID in 'phase1test@example.com' '9876543210' '+91 98765 43210' 'RSW-XXXXXX'; do
  printf '%s -> ' "$ID"
  curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:5000/api/auth/login \
    -H 'Content-Type: application/json' -d "{\"identifier\":\"$ID\",\"password\":\"secret123\"}"
done
```

Replace `RSW-XXXXXX` with the real ID. Expected: `200` for all four.

Then the failure paths:

```bash
curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"phase1test@example.com","password":"wrongpass"}'
curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"identifier":"nobody@example.com","password":"secret123"}'
```

Expected: both return **exactly** `"Invalid credentials"`. If the two messages differ, the enumeration guard is broken — fix before continuing.

- [ ] **Step 3: Verify the admin login page still works**

Open `http://localhost:5173/admin/login`, sign in with the `.env` admin credentials.
Expected: reaches the dashboard. (The admin page posts `email`, which the `req.body.identifier ?? req.body.email` fallback handles.)

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/authController.js
git commit -m "feat(auth): log in with email, phone or user ID"
```

---

### Task 9: Forgot password, reset password, change password, session renewal

**Files:**
- Modify: `server/src/controllers/authController.js`
- Modify: `server/src/routes/authRoutes.js`

**Interfaces:**
- Consumes: `crypto`, `sendPasswordResetEmail` (Task 6), `identifierQuery` (Task 8).
- Produces: `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password`, and a `GET /auth/me` that may include a refreshed `token`. Tasks 10–13 call all of these.

- [ ] **Step 1: Replace `me` and add the three new handlers**

Replace the existing `me` export, and append the rest, in `server/src/controllers/authController.js`:

```javascript
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const RENEW_TOKEN_AFTER_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function hashResetToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex")
}

export const me = asyncHandler(async (req, res) => {
  const body = { user: toPublicUser(req.user) }

  // Slide the session forward for anyone still using the site, so an active
  // customer is never forced to sign in again. `req.tokenIssuedAt` is set by
  // `protect`.
  const issuedAtMs = (req.tokenIssuedAt ?? 0) * 1000
  if (issuedAtMs && Date.now() - issuedAtMs > RENEW_TOKEN_AFTER_MS) {
    body.token = generateToken(req.user)
  }

  res.json(body)
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body

  // Always the same answer, always 200: replying "no such account" would let
  // anyone test which emails and phone numbers are registered here.
  const genericResponse = { message: "If that account exists, a reset link is on its way." }

  if (!identifier) return res.json(genericResponse)

  const or = identifierQuery(String(identifier))
  if (or.length === 0) return res.json(genericResponse)

  const user = await User.findOne({ $or: or })
  if (!user) return res.json(genericResponse)

  const rawToken = crypto.randomBytes(32).toString("hex")
  user.passwordResetToken = hashResetToken(rawToken)
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save()

  await sendPasswordResetEmail(user, rawToken)

  res.json(genericResponse)
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  if (!token) throw new ApiError(400, "This reset link is invalid or has expired")
  if (!password) throw new ApiError(400, "Password is required")
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters")

  const user = await User.findOne({
    passwordResetToken: hashResetToken(String(token)),
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +passwordResetToken +passwordResetExpires")

  if (!user) throw new ApiError(400, "This reset link is invalid or has expired")

  user.password = password
  user.tokenVersion = (user.tokenVersion ?? 0) + 1
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // Signed in immediately — the customer just proved control of the inbox.
  const newToken = generateToken(user)
  res.json({ token: newToken, user: toPublicUser(user) })
})

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body

  if (!currentPassword || !password) throw new ApiError(400, "Both passwords are required")
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters")

  const user = await User.findById(req.user._id).select("+password")
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Your current password is not correct")
  }

  user.password = password
  user.tokenVersion = (user.tokenVersion ?? 0) + 1
  await user.save()

  // Bumping tokenVersion invalidated this caller's own token too, so hand
  // back a fresh one — they stay signed in here, everywhere else is signed out.
  const newToken = generateToken(user)
  res.json({ token: newToken, user: toPublicUser(user) })
})
```

- [ ] **Step 2: Expose the token's issue time to `me`**

In `server/src/middleware/auth.js`, immediately after the `tokenVersion` check added in Task 4, add:

```javascript
  req.tokenIssuedAt = payload.iat
```

- [ ] **Step 3: Register the routes**

Replace the whole of `server/src/routes/authRoutes.js`:

```javascript
import { Router } from "express"
import {
  login,
  me,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"

const router = Router()

router.post("/login", login)
router.post("/register", register)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.post("/change-password", protect, changePassword)
router.get("/me", protect, me)

export default router
```

- [ ] **Step 4: Walk the whole reset flow**

```bash
# 1. Request a reset for the Task 7 account
curl -s -X POST http://localhost:5000/api/auth/forgot-password \
  -H 'Content-Type: application/json' -d '{"identifier":"phase1test@example.com"}'

# 2. Request one for an account that does not exist
curl -s -X POST http://localhost:5000/api/auth/forgot-password \
  -H 'Content-Type: application/json' -d '{"identifier":"ghost@example.com"}'
```

Expected: **identical** JSON from both. Only the first sends mail.

Since `phase1test@example.com` is not a real inbox, read the raw token straight from Mongo for the next step — the stored value is a hash, so mint a known pair instead:

```bash
cd server && cat > reset-check.tmp.mjs <<'EOF'
import "dotenv/config"
import mongoose from "mongoose"
import crypto from "crypto"
import User from "./src/models/User.js"

await mongoose.connect(process.env.MONGODB_URI)
const raw = crypto.randomBytes(32).toString("hex")
const user = await User.findOne({ email: "phase1test@example.com" })
user.passwordResetToken = crypto.createHash("sha256").update(raw).digest("hex")
user.passwordResetExpires = new Date(Date.now() + 3600_000)
await user.save()
console.log("RAW_TOKEN:", raw)
await mongoose.disconnect()
EOF
node reset-check.tmp.mjs; rm -f reset-check.tmp.mjs
```

Then, with `<RAW>` from that output:

```bash
# 3. Reset succeeds and signs you in
curl -s -X POST http://localhost:5000/api/auth/reset-password -H 'Content-Type: application/json' \
  -d '{"token":"<RAW>","password":"newsecret123"}' | head -c 200
# 4. The same link a second time now fails
curl -s -X POST http://localhost:5000/api/auth/reset-password -H 'Content-Type: application/json' \
  -d '{"token":"<RAW>","password":"another123"}'
# 5. Old password rejected, new password accepted
curl -s -o /dev/null -w 'old:%{http_code}\n' -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"identifier":"phase1test@example.com","password":"secret123"}'
curl -s -o /dev/null -w 'new:%{http_code}\n' -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"identifier":"phase1test@example.com","password":"newsecret123"}'
```

Expected: step 3 returns a token and user; step 4 returns "This reset link is invalid or has expired"; step 5 prints `old:401` then `new:200`.

- [ ] **Step 5: Verify tokenVersion revocation**

```bash
# Grab a token, change the password, then reuse the OLD token
cd server && cat > revoke-check.tmp.mjs <<'EOF'
const base = "http://localhost:5000/api"
const login = await (await fetch(`${base}/auth/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identifier: "phase1test@example.com", password: "newsecret123" }),
})).json()

const before = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${login.token}` } })
console.log("old token before change:", before.status)

await fetch(`${base}/auth/change-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${login.token}` },
  body: JSON.stringify({ currentPassword: "newsecret123", password: "thirdsecret123" }),
})

const after = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${login.token}` } })
console.log("old token after change:", after.status)
EOF
node revoke-check.tmp.mjs; rm -f revoke-check.tmp.mjs
```

Expected: `old token before change: 200` then `old token after change: 401`.

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/authController.js server/src/routes/authRoutes.js server/src/middleware/auth.js
git commit -m "feat(auth): forgot/reset/change password and sliding sessions"
```

---

### Task 10: Backfill User IDs for existing accounts

**Files:**
- Create: `server/scripts/backfillUserIds.js`
- Modify: `server/package.json`

**Interfaces:**
- Consumes: `generateUserId` (Task 2), `User` (Task 3).
- Produces: an npm script `backfill-user-ids`.

- [ ] **Step 1: Write the script**

Create `server/scripts/backfillUserIds.js`:

```javascript
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
```

`validateBeforeSave: false` matters: these documents predate the new fields and may not satisfy every validator, and this script's only job is to add an ID.

- [ ] **Step 2: Add the npm script**

In `server/package.json` `scripts`, after `"fix-package-types"`:

```json
    "backfill-user-ids": "node scripts/backfillUserIds.js"
```

- [ ] **Step 3: Run it, then run it again**

Run: `cd server && npm run backfill-user-ids`
Expected: reports the number of existing users (6 at time of writing: 5 customers + admin) and prints an ID for each.

Run it a second time.
Expected: `0 user(s) need a userId` / `Done. 0 updated.`

- [ ] **Step 4: Confirm no duplicates exist**

```bash
cd server && cat > dupe-check.tmp.mjs <<'EOF'
import "dotenv/config"
import mongoose from "mongoose"
import User from "./src/models/User.js"
await mongoose.connect(process.env.MONGODB_URI)
const total = await User.countDocuments()
const withId = await User.countDocuments({ userId: { $exists: true, $ne: null } })
const distinct = (await User.distinct("userId")).filter(Boolean).length
console.log({ total, withId, distinct, ok: total === withId && withId === distinct })
await mongoose.disconnect()
EOF
node dupe-check.tmp.mjs; rm -f dupe-check.tmp.mjs
```

Expected: `ok: true`.

- [ ] **Step 5: Commit**

```bash
git add server/scripts/backfillUserIds.js server/package.json
git commit -m "feat(auth): backfill user IDs for existing accounts"
```

---

### Task 11: Frontend auth plumbing

**Files:**
- Modify: `src/context/AuthContext.jsx`

**Interfaces:**
- Consumes: the endpoints from Tasks 7–9.
- Produces the context value used by Tasks 12–14:
  - `login(identifier: string, password: string) => Promise<user>`
  - `register({ name, email, phone, password }) => Promise<user>`
  - `forgotPassword(identifier: string) => Promise<{ message: string }>`
  - `resetPassword(token: string, password: string) => Promise<user>`
  - `changePassword(currentPassword: string, password: string) => Promise<user>`
  - plus the existing `user`, `loading`, `logout`.

- [ ] **Step 1: Rewrite the provider**

Replace the body of `src/context/AuthContext.jsx` between the imports and `useAuth`:

```javascript
const AuthContext = createContext(null)
const TOKEN_KEY = "rs_token"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        // The server slides the session forward once the token is a week old,
        // so an active customer never gets signed out.
        if (data.token) localStorage.setItem(TOKEN_KEY, data.token)
        setUser(data.user)
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async ({ name, email, phone, password }) => {
    const { data } = await api.post("/auth/register", { name, email, phone, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const forgotPassword = useCallback(async (identifier) => {
    const { data } = await api.post("/auth/forgot-password", { identifier })
    return data
  }, [])

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post("/auth/reset-password", { token, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const changePassword = useCallback(async (currentPassword, password) => {
    const { data } = await api.post("/auth/change-password", { currentPassword, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, forgotPassword, resetPassword, changePassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 2: Confirm the admin login page needs no change**

`src/admin/pages/Login.jsx:25` calls `login(email, password)` — two positional strings, which the new `login(identifier, password)` signature accepts unchanged. Its input is `type="email"`, so the admin signs in by email only; that is intentional for this phase (admin credential management is Phase 3).

**Make no edit to this file.** Read line 25 to confirm it reads `const loggedIn = await login(email, password)` and move on. It is listed in this task only so the next step's regression check is not a surprise.

- [ ] **Step 3: Verify both existing login paths**

Run: `cd .. && npm run dev` (from repo root), then:
- `http://localhost:5173/admin/login` — sign in with the admin credentials → dashboard loads.
- `http://localhost:5173/login` — sign in with `phase1test@example.com` / `thirdsecret123` → lands on the storefront, header shows the account.

Expected: both succeed. (`/login` still shows the old single-email form until Task 13.)

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.jsx
git commit -m "feat(auth): identifier login, register with phone, reset flows in AuthContext"
```

---

### Task 12: Shared auth page shell

**Files:**
- Create: `src/components/auth/AuthLayout.jsx`
- Create: `src/components/auth/AuthField.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces, used by Tasks 13–14:
  - `<AuthLayout title, subtitle, footer, children />`
  - `<AuthField label, type, value, onChange, placeholder, required, autoComplete, hint, error, ...rest />` — renders a labelled input; when `type="password"` it adds a show/hide toggle.

- [ ] **Step 1: Create `AuthLayout`**

Create `src/components/auth/AuthLayout.jsx`:

```jsx
import { Link } from "react-router-dom"

// One shell for login / register / forgot / reset so the four pages read as a
// set rather than four separately-invented forms.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <section className="container-rs flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient font-display text-sm font-bold text-white">
            RS
          </span>
          <span className="font-display text-lg font-bold text-cloud-100">RSWebSoft</span>
        </Link>

        <div className="rounded-2xl border border-ink-800 bg-ink-850 p-7 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-cloud-100">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-cloud-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-5 text-center text-sm text-cloud-400">{footer}</div>}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `AuthField`**

Create `src/components/auth/AuthField.jsx`:

```jsx
import { useState, useId } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function AuthField({ label, type = "text", hint, error, ...rest }) {
  const [revealed, setRevealed] = useState(false)
  const id = useId()
  const isPassword = type === "password"
  const inputType = isPassword && revealed ? "text" : type

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-cloud-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? "true" : undefined}
          className={`w-full rounded-lg border bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none ${
            error ? "border-status-bad" : "border-ink-700 focus:border-brand-500"
          } ${isPassword ? "pr-11" : ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-1 top-1/2 grid h-8 w-9 -translate-y-1/2 place-items-center rounded-md text-cloud-500 transition hover:text-cloud-300"
            aria-label={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-status-bad">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-cloud-500">{hint}</p>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Verify they compile**

Run: `npx oxlint src/components/auth/ && npx vite build`
Expected: lint clean, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/
git commit -m "feat(auth): shared auth layout and field components"
```

---

### Task 13: Login and Register pages

**Files:**
- Modify: `src/pages/Login.jsx` (full rewrite)
- Modify: `src/pages/Register.jsx` (full rewrite)

**Interfaces:**
- Consumes: `AuthLayout`, `AuthField` (Task 12); `login`, `register` (Task 11).
- Produces: nothing other tasks consume.

- [ ] **Step 1: Rewrite `Login.jsx`**

Replace the whole of `src/pages/Login.jsx`:

```jsx
import { useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(identifier, password)
      toast.success("Welcome back!")
      navigate(location.state?.from || "/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your email, phone number or user ID."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-brand-300 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email, phone or user ID"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
        />
        <div>
          <AuthField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-brand-300 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <LogIn size={16} /> {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  )
}
```

- [ ] **Step 2: Rewrite `Register.jsx`**

Replace the whole of `src/pages/Register.jsx`:

```jsx
import { useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { UserPlus } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

const EMPTY = { name: "", email: "", phone: "", password: "" }

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  // Mirrors the server's rules so the customer is told what's wrong before a
  // round trip. The server still validates — this is convenience, not trust.
  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = "Enter your name"
    if (!form.email.trim()) next.email = "Enter your email"
    const digits = form.phone.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "")
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      next.phone = "Enter a valid 10-digit mobile number"
    }
    if (form.password.length < 6) next.password = "At least 6 characters"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await register(form)
      toast.success("Account created — check your email for your user ID")
      navigate(location.state?.from || "/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="You'll need an account to buy — it also keeps your orders and downloads in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-300 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          label="Full name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
          placeholder="Your name"
        />
        <AuthField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <AuthField
          label="Phone"
          type="tel"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
          hint="You can sign in with this later"
          placeholder="98765 43210"
        />
        <AuthField
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          error={errors.password}
          hint="At least 6 characters"
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <UserPlus size={16} /> {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-xs text-cloud-500">
          We'll email your user ID. We never send passwords by email.
        </p>
      </form>
    </AuthLayout>
  )
}
```

- [ ] **Step 3: Verify in the browser**

With both servers running, at `http://localhost:5173/register`:
- Submit empty → four inline field errors, no network request.
- Enter phone `12345` → "Enter a valid 10-digit mobile number".
- Register a fresh account → toast, redirected home, welcome email arrives.
- Sign out, then at `/login` sign in with that account's phone, then its email, then its User ID.
- Click the eye toggle on the password field → the value shows and hides.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.jsx src/pages/Register.jsx
git commit -m "feat(auth): redesign login and register with identifier and phone"
```

---

### Task 14: Forgot-password and reset-password pages

**Files:**
- Create: `src/pages/ForgotPassword.jsx`
- Create: `src/pages/ResetPassword.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `AuthLayout`, `AuthField` (Task 12); `forgotPassword`, `resetPassword` (Task 11).
- Produces: routes `/forgot-password` and `/reset-password/:token`.

- [ ] **Step 1: Create `ForgotPassword.jsx`**

Create `src/pages/ForgotPassword.jsx`:

```jsx
import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [identifier, setIdentifier] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await forgotPassword(identifier)
      // Always the same confirmation, whether or not the account exists —
      // anything else would let a visitor test which emails are registered.
      setSent(true)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If that account exists, a reset link is on its way. The link works once and expires in an hour."
        footer={
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand-300 hover:underline">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-cloud-400">
          Nothing after a few minutes? Check your spam folder, or{" "}
          <button onClick={() => setSent(false)} className="font-medium text-brand-300 hover:underline">
            try a different email
          </button>
          .
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email, phone or user ID and we'll send a reset link."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand-300 hover:underline">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email, phone or user ID"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <Mail size={16} /> {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  )
}
```

- [ ] **Step 2: Create `ResetPassword.jsx`**

Create `src/pages/ResetPassword.jsx`:

```jsx
import { useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { KeyRound } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"
import AuthLayout from "../components/auth/AuthLayout"
import AuthField from "../components/auth/AuthField"

export default function ResetPassword() {
  const { token } = useParams()
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    const next = {}
    if (password.length < 6) next.password = "At least 6 characters"
    if (password !== confirm) next.confirm = "Passwords don't match"
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await resetPassword(token, password)
      toast.success("Password updated — you're signed in")
      navigate("/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose something you haven't used here before."
      footer={
        <>
          Link expired?{" "}
          <Link to="/forgot-password" className="font-medium text-brand-300 hover:underline">
            Request a new one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setErrors((s) => ({ ...s, password: undefined }))
          }}
          error={errors.password}
          hint="At least 6 characters"
          placeholder="••••••••"
        />
        <AuthField
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            setErrors((s) => ({ ...s, confirm: undefined }))
          }}
          error={errors.confirm}
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          <KeyRound size={16} /> {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  )
}
```

- [ ] **Step 3: Register the routes**

In `src/App.jsx`, add the two imports beside the existing page imports (note the customer login page is imported there as `CustomerLogin` — the bare `Login` is the admin one):

```jsx
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
```

and add these two routes on the line immediately after `<Route path="/register" element={<Register />} />` (currently `src/App.jsx:71`), which keeps them above the `path="*"` catch-all on the next line:

```jsx
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
```

- [ ] **Step 4: Walk the flow end to end in the browser**

1. `/login` → "Forgot password?" → enter a registered email → confirmation screen appears.
2. Enter a junk email → **the same** confirmation screen, no error, no hint that it was unknown.
3. Open the reset link from the real email → set a new password → toast, signed in, landed on `/`.
4. Open the same link again → "This reset link is invalid or has expired" with a working link to `/forgot-password`.
5. Sign in with the new password → works. Old password → "Invalid credentials".

- [ ] **Step 5: Lint and build**

Run: `npx oxlint src/ && npx vite build`
Expected: lint clean, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ForgotPassword.jsx src/pages/ResetPassword.jsx src/App.jsx
git commit -m "feat(auth): forgot-password and reset-password pages"
```

---

### Task 15: Full-flow regression pass

**Files:**
- Modify: `server/.env.example` (document the changed default)

**Interfaces:**
- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Document the session default**

In `server/.env.example`, change the `JWT_EXPIRES_IN` line to:

```
# Sessions slide forward on use — /auth/me re-issues a token once the current
# one is over 7 days old, so an active customer is never signed out.
JWT_EXPIRES_IN=30d
```

- [ ] **Step 2: Run the whole server test suite**

Run: `cd server && npm test`
Expected: PASS — 12 tests, 0 failures.

- [ ] **Step 3: Run the spec's manual checklist**

Work through §Testing of `docs/superpowers/specs/2026-08-04-auth-core-phase1-design.md` items 1–8 in the browser. Every one must pass. Item 8 (admin login still works) is the regression that matters most — if it fails, the `tv` back-compat in Task 4 is wrong.

- [ ] **Step 4: Verify purchase gating is intact**

Sign out. Add a product to the cart, go to `/checkout`.
Expected: redirected to `/login`; after signing in, you land back on `/checkout` and can complete an order that appears under `/account/orders`.

- [ ] **Step 5: Clean up test accounts**

```bash
cd server && cat > cleanup.tmp.mjs <<'EOF'
import "dotenv/config"
import mongoose from "mongoose"
import User from "./src/models/User.js"
await mongoose.connect(process.env.MONGODB_URI)
const r = await User.deleteMany({ email: /@example\.com$/ })
console.log("removed test accounts:", r.deletedCount)
await mongoose.disconnect()
EOF
node cleanup.tmp.mjs; rm -f cleanup.tmp.mjs
```

Only run this if the `@example.com` accounts were created during this plan. Check the list first if unsure.

- [ ] **Step 6: Commit**

```bash
git add server/.env.example
git commit -m "docs: note the 30-day sliding session default"
```

---

## Self-review notes

**Spec coverage:** Goals 1–7 map to Tasks 2+7 (User ID), 1+7 (phone), 8 (multi-identifier login), 6+9 (password reset), 4+9 (30-day sliding session), 4+9 (revocation on password change), 12–14 (redesigned pages). The spec's data-model table maps to Task 3, its endpoint table to Tasks 7–9, its email section to Tasks 5–6, its migration section to Task 10, its frontend section to Tasks 11–14, and its testing section to Task 15.

**Deliberate deviation:** the spec lists `changePassword` under Phase 1 endpoints but no Phase 1 page calls it — the account panel that exposes it is Phase 2. The endpoint is built and tested here (Task 9, Step 5) because `resetPassword` shares its `tokenVersion` logic and testing them together is what proves revocation works.
