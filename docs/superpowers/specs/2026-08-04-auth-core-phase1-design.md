# Auth Core (Phase 1) — Design Spec

Date: 2026-08-04

## Problem

The customer auth built in `2026-07-22-customer-auth-design.md` shipped the minimum: register with name/email/password, log in with email/password, and a session that expires after 7 days. Four gaps have since been reported:

1. **No account recovery.** A customer who forgets their password has no way back in — there is no forgot-password flow, and no admin action to reset one either.
2. **Email is the only identity.** Customers who signed up months ago often remember their phone number but not which email address they used.
3. **No phone on file.** The `User` model has no `phone` field, so checkout collects it fresh every time and the shop has no way to contact a customer outside email.
4. **Sessions expire too often.** `JWT_EXPIRES_IN` defaults to `7d` with no renewal, so a regular customer is forced to log in roughly every week.

The client also asked for a customer-facing account ID that can be quoted in support conversations, and for the login/register pages to feel like a mainstream storefront rather than a bare form.

## Goals

1. Every customer has a short, human-quotable **User ID** (`RSW-XXXXXX`), delivered by email at signup.
2. Signup collects **name, email, phone, password**; phone is stored on the account.
3. Login accepts **email, phone, or User ID** in a single identifier field.
4. Customers can **reset a forgotten password** over email.
5. Sessions last **30 days and auto-extend** while the customer keeps using the site.
6. Changing a password **invalidates existing sessions** on other devices.
7. Login, register, forgot-password and reset-password pages are redesigned to storefront quality.

## Non-goals (out of scope for this pass)

- Phone/OTP verification. No SMS provider is configured, and adding one is a separate cost and integration decision. Phone is collected and used as a login identifier, but is not proven to belong to the user.
- Email address verification at signup.
- The customer account panel (wishlist, coupons, gift cards, profile editing) — Phase 2.
- Admin changing their own credentials from the admin panel — Phase 3.
- Gift cards — Phase 4.
- Social / OAuth login.

## Security decisions

These are deliberate and should not be "simplified" later without re-reading this section.

- **The welcome email never contains a password.** The customer chooses their own password during signup, so mailing it back adds no information and leaves a permanent plaintext credential in their inbox. The welcome email carries the User ID — which genuinely is new information — plus a link to sign in.
- **`POST /auth/forgot-password` always returns 200**, whether or not the identifier matched an account. Returning 404 for unknown identifiers turns the endpoint into an account-enumeration oracle.
- **`POST /auth/login` always returns the same error message** ("Invalid credentials") for unknown identifier and wrong password. Distinguishing them leaks which emails/phones are registered.
- **Reset tokens are stored hashed.** The raw token goes in the email link only; the database stores its SHA-256 hash. A leaked database backup therefore cannot be used to take over accounts.
- **Reset tokens are single-use and expire in 1 hour**, cleared on successful reset.
- **`tokenVersion` invalidates old JWTs.** Any password change (self-service or reset) increments it, so a stolen token stops working the moment the victim resets.

**Known accepted tradeoff:** `POST /auth/register` *does* distinguish "email already registered" from "phone already registered", which makes it an enumeration oracle in a way that login and forgot-password deliberately are not. The alternative — a generic "could not register" — leaves a real customer with no idea which field to change, which is why essentially every consumer storefront accepts this. It is recorded here so the inconsistency is understood as a decision rather than an oversight. If enumeration becomes a concern, the fix is rate limiting on the endpoint, not a vaguer error.

## Data model

### `server/src/models/User.js`

New fields:

| Field | Type | Notes |
|---|---|---|
| `userId` | String | Unique, sparse, indexed, uppercase. Format `RSW-XXXXXX`. |
| `phone` | String | Unique, sparse, indexed. Stored normalised (digits only, leading `91`/`0` stripped). |
| `tokenVersion` | Number | Default `0`. Bumped on every password change. |
| `passwordResetToken` | String | SHA-256 hash of the emailed token. `select: false`. |
| `passwordResetExpires` | Date | `select: false`. |

**`phone` is not `required` at the schema level.** The five existing customers have no phone number, and a schema-level requirement would make every subsequent `.save()` on those documents fail validation — including an admin password change. Phone is required by the register controller only.

Both `userId` and `phone` use `unique: true, sparse: true` so that documents missing the field do not collide on `null`.

### User ID generation — `server/src/utils/generateUserId.js`

- Alphabet: `23456789ABCDEFGHJKMNPQRSTUVWXYZ` — digits `0`/`1` and letters `O`/`I`/`L` are excluded because they are ambiguous when a customer reads the ID aloud to support or copies it off a screen.
- 6 characters drawn with `crypto.randomInt`, prefixed `RSW-`. That is 31^6 ≈ 887 million combinations, so collisions are rare, but generation retries on duplicate-key error up to 5 times before failing the request.

### Phone normalisation — `server/src/utils/normalizePhone.js`

Strips everything except digits, then removes a leading `91` (country code) or `0` if the result is 12 or 11 digits respectively. `+91 98765-43210`, `098765 43210` and `9876543210` all normalise to `9876543210`, so a customer can log in with whichever form they type.

This is **India-only**, matching the rest of the storefront (prices are INR-only, `formatINR` has no currency switch, payment is UPI-only). A 10-digit result is treated as valid; anything else fails validation at register. If the shop ever sells outside India this function is the single place that has to change.

## Backend changes

### `server/src/controllers/authController.js`

`toPublicUser` gains `userId` and `phone`.

| Endpoint | Auth | Behaviour |
|---|---|---|
| `POST /auth/register` | public | Requires `name`, `email`, `phone`, `password` (min 6). Normalises phone. 409 if email or phone already registered (these are distinguishable at signup — the user is proving they hold the address, and a generic error would leave them unable to tell what to change). Generates `userId`, creates the user, sends the welcome email (failure logged, does not fail the request), returns `{ token, user }`. |
| `POST /auth/login` | public | Takes `identifier` + `password`. Resolves via a single `$or` query on `email` (lowercased), `phone` (normalised) and `userId` (uppercased). Always 401 "Invalid credentials" on any failure. |
| `POST /auth/forgot-password` | public | Takes `identifier`. On match: generates a raw token, stores its hash + 1h expiry, emails the reset link. Always returns `{ message: "If that account exists, a reset link is on its way." }` with 200. |
| `POST /auth/reset-password` | public | Takes `token` + `password`. Hashes the token, looks up by hash with `passwordResetExpires: { $gt: Date.now() }`. 400 "This reset link is invalid or has expired" otherwise. Sets password, increments `tokenVersion`, clears reset fields, returns a fresh `{ token, user }` so the user lands logged in. |
| `POST /auth/change-password` | protect | Takes `currentPassword` + `password`. Verifies current, increments `tokenVersion`, returns a fresh token so the caller's own session survives while every other device is signed out. |
| `GET /auth/me` | protect | Unchanged shape, but may additionally return `token` — see Session renewal. |

Routes are registered in `server/src/routes/authRoutes.js` in that order.

### Session renewal

- `server/src/utils/generateToken.js`: payload becomes `{ id, role, tv }` where `tv` is `user.tokenVersion`. Default expiry changes from `7d` to `30d` (still overridable via `JWT_EXPIRES_IN`).
- `server/src/middleware/auth.js` (`protect`): after loading the user, rejects with 401 if `(decoded.tv ?? 0) !== (user.tokenVersion ?? 0)`. Tokens minted before this ships carry no `tv` and existing user documents have no `tokenVersion`, so both sides default to `0` and every current session keeps working through the deploy.
- `GET /auth/me`: if the token's `iat` is more than 7 days old, mint a fresh 30-day token and include it as `token` in the response. The frontend stores it when present. A customer who visits at least once a month is never logged out.

### Emails — `server/src/services/mailService.js`

Two new functions following the existing `renderTemplate` + `escapeHtml` pattern, each wrapped in try/catch returning `{ ok, error }` so a mail failure never breaks the HTTP request:

- `sendWelcomeEmail(user)` → template `server/src/templates/emails/welcome.html`. Content: greeting by name, the User ID displayed prominently, a note that they can sign in with User ID, email or phone, and a button to `${CLIENT_URL}/login`. **No password.**
- `sendPasswordResetEmail(user, rawToken)` → template `passwordReset.html`. Content: greeting, a button to `${CLIENT_URL}/reset-password/${rawToken}`, the one-hour expiry, and a line saying to ignore the mail if they did not request it.

### Migration — `server/scripts/backfillUserIds.js`

Idempotent one-off: finds users with no `userId`, assigns a generated one to each, reports how many were updated. Safe to re-run. Run once after deploy; existing users then see their ID in the account panel (Phase 2) and can use it to log in immediately.

## Frontend changes

### `src/context/AuthContext.jsx`

- `login(identifier, password)` — signature changes from `(email, password)`.
- `register({ name, email, phone, password })` — signature changes from positional args to an object, since it now carries four fields.
- `forgotPassword(identifier)`, `resetPassword(token, password)`, `changePassword(currentPassword, password)` added.
- The `/auth/me` bootstrap stores `data.token` when the response includes one (session renewal).

### Pages

All four use the storefront's existing token palette (`ink`/`cloud`/`brand`) and are built as one coherent set — a shared `AuthLayout` component carrying the panel, brand mark and heading, so the four pages differ only in their form body rather than each re-implementing the shell.

- `src/pages/Login.jsx` (rewrite) — one field labelled "Email, phone or user ID", one password field with a show/hide toggle, "Forgot password?" link, link to register. Submits `identifier`.
- `src/pages/Register.jsx` (rewrite) — name, email, phone, password. Client-side: password min 6, phone must contain 10 digits after normalisation. Explains that the User ID will be emailed.
- `src/pages/ForgotPassword.jsx` (new) — identifier field. On submit, always swaps to a "check your email" confirmation state; the copy must not reveal whether the account existed.
- `src/pages/ResetPassword.jsx` (new) — new password + confirm, reads the token from the route param. On success the user is logged in and sent to `/`.

### Routing — `src/App.jsx`

Two new public routes inside `PublicLayout`: `/forgot-password` and `/reset-password/:token`.

## Error handling

- Register: missing field → 400 naming the field; duplicate email → 409 "That email is already registered"; duplicate phone → 409 "That phone number is already registered"; weak password → 400 "Password must be at least 6 characters".
- Login: any failure → 401 "Invalid credentials". The frontend shows it verbatim; it must not add a guess about which field was wrong.
- Forgot password: never errors on unknown identifier. A genuine mail-send failure is logged server-side and still returns 200 to the client.
- Reset password: expired/used/unknown token → 400 "This reset link is invalid or has expired", with a link back to `/forgot-password`.
- Mail-send failures during register are logged and swallowed — the account is created and the customer is logged in regardless; they can recover the User ID from the account panel later.

## Testing

No test framework is configured in this project (no jest/vitest in either `package.json`), so verification is manual against the dev server, plus a scripted check for the parts that are awkward to exercise by hand.

Manual:

1. Register with name/email/phone → lands logged in, welcome email arrives containing a `RSW-` ID and no password.
2. Log out. Log in three times: with email, with phone (in each of `9876543210`, `+91 98765 43210`, `098765 43210` forms), and with the User ID.
3. Wrong password and unknown identifier both produce exactly "Invalid credentials".
4. Forgot password with a real identifier → mail arrives; with a junk identifier → same on-screen confirmation, no mail.
5. Follow the reset link, set a new password → lands logged in; old password no longer works; the link fails on second use.
6. Register a second account with an already-used phone → 409 naming the phone.
7. Checkout still requires login and still records the order against the account.
8. Existing admin login at `/admin/login` still works, and the admin can still reach the admin panel (verifies the `tv` back-compat path for tokens minted before this ships).

Scripted (`node` one-off, not committed): confirm `backfillUserIds.js` assigns IDs to all existing users, is idempotent on a second run, and produces no duplicates.
