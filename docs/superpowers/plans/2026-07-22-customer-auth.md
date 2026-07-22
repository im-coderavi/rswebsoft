# Customer Login / Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the non-functional "Login / Register" header button with a real customer account system: register/login, login-gated checkout, orders linked to accounts with a customer-facing order history, and an admin Customers view.

**Architecture:** Reuse the existing JWT + `AuthContext` pattern already used for admin login (same `User` model, same `/auth/*` endpoints, same token-in-localStorage approach) instead of building a parallel system. Extend `Order` with a `user` reference so checkout (now login-required) stamps every order with the account that placed it, and add read endpoints for both the customer's own orders and the admin's view of all customers.

**Tech Stack:** Express + Mongoose (backend, `server/`), React 19 + React Router v7 + TanStack Query + axios + react-hot-toast (frontend, `src/`). No test framework is configured in either package — verification is via `curl` against the running backend (Tasks 1–3) and manual browser walkthroughs (Tasks 4–10).

## Global Constraints

- No email verification — there is no email-sending service in this project.
- No password-reset flow.
- No profile-editing page — out of scope for this pass.
- Checkout requires login. Guest checkout is removed; `POST /orders` becomes an authenticated endpoint.
- Pre-existing guest orders (if any exist in a local DB from before this ships) are not migrated — they simply show `user: null` / "Guest" in the admin view.
- Follow existing conventions exactly: `asyncHandler` + `ApiError` in controllers, `apiErrorMessage` + `react-hot-toast` for frontend errors, the `DataTable` component for admin tables, `formatINR` for money display.
- The token's localStorage key changes from `rs_admin_token` to `rs_token` — any admin session active in a browser gets signed out once, the first time this ships. This is expected, not a bug.

---

### Task 1: Customer registration endpoint

**Files:**
- Modify: `server/src/controllers/authController.js`
- Modify: `server/src/routes/authRoutes.js`

**Interfaces:**
- Produces: `POST /api/auth/register` — body `{ name, email, password }` → `201 { token, user: { id, name, email, role, avatarUrl } }` on success; `400` if any field missing; `409` if the email is already registered. Response shape matches the existing `POST /api/auth/login`.

- [ ] **Step 1: Add the `register` controller**

In `server/src/controllers/authController.js`, add a new export below `login` (keep `toPublicUser`, `login`, and `me` unchanged):

```js
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required")
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) throw new ApiError(409, "Email already registered")

  const user = await User.create({ name, email: email.toLowerCase(), password })
  const token = generateToken(user)
  res.status(201).json({ token, user: toPublicUser(user) })
})
```

- [ ] **Step 2: Wire the route**

In `server/src/routes/authRoutes.js`, update the imports and add the route:

```js
import { Router } from "express"
import { login, me, register } from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"

const router = Router()

router.post("/login", login)
router.post("/register", register)
router.get("/me", protect, me)

export default router
```

- [ ] **Step 3: Verify manually**

Start the backend if it isn't already running: `npm run server` (from the project root, per `package.json`). Then, with that server up:

```bash
curl -s -i -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","email":"testcustomer@example.com","password":"password123"}'
```

Expected: `HTTP/1.1 201` and a JSON body containing `"token"` and `"user":{"...","name":"Test Customer","email":"testcustomer@example.com","role":"user",...}`.

Run the exact same command again. Expected this time: `HTTP/1.1 409` and `{"message":"Email already registered"}`.

Then check missing-field validation:

```bash
curl -s -i -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"missingname@example.com","password":"password123"}'
```

Expected: `HTTP/1.1 400` and `{"message":"Name, email and password are required"}`.

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/authController.js server/src/routes/authRoutes.js
git commit -m "feat(server): add customer registration endpoint"
```

---

### Task 2: Link orders to accounts + order history endpoint

**Files:**
- Modify: `server/src/models/Order.js`
- Modify: `server/src/controllers/orderController.js`
- Modify: `server/src/routes/orderRoutes.js`

**Interfaces:**
- Consumes: `protect` middleware from `server/src/middleware/auth.js` (sets `req.user` to the full Mongoose `User` document).
- Produces: `Order.user` field (`ObjectId | null`, ref `"User"`). `POST /api/orders` now requires `Authorization: Bearer <token>` and stamps `order.user = req.user._id`. New `GET /api/orders/mine` (auth required) returns the caller's own orders. `GET /api/orders` (admin) now populates `user` as `{ _id, name, email }` instead of a bare id.

- [ ] **Step 1: Add the `user` field to the Order model**

In `server/src/models/Order.js`, add the field to the schema (right after `customer`):

```js
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customer: { type: customerSchema, required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["upi"], default: "upi" },
    paymentReference: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "paid", "fulfilled", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
)
```

- [ ] **Step 2: Stamp the account on order creation, add `myOrders`, populate `listOrders`**

In `server/src/controllers/orderController.js`:

Change the `listOrders` export to populate the account:

```js
export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate("user", "name email")
  res.json(orders)
})
```

Add a new `myOrders` export (place it near `listOrders`):

```js
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(orders)
})
```

In `createOrder`, add `user: req.user._id` to the `Order.create(...)` call:

```js
  const order = await Order.create({
    user: req.user._id,
    customer,
    items: orderItems,
    total,
    paymentReference: paymentReference || "",
  })
```

Leave `trackOrder` untouched.

- [ ] **Step 3: Require auth on order creation, add the `/mine` route**

In `server/src/routes/orderRoutes.js`:

```js
import { Router } from "express"
import { listOrders, updateOrderStatus, createOrder, trackOrder, myOrders } from "../controllers/orderController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listOrders)
router.get("/mine", protect, myOrders)
router.post("/", protect, createOrder)
router.get("/:id/track", trackOrder)
router.put("/:id", protect, adminOnly, updateOrderStatus)

export default router
```

- [ ] **Step 4: Verify manually**

With the backend running (`npm run server`):

Confirm order creation now requires auth:

```bash
curl -s -i -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":{"name":"a","email":"a@a.com","phone":"123"},"items":[]}'
```

Expected: `HTTP/1.1 401` and `{"message":"Not authenticated"}`.

Register a fresh customer and use the returned token for the rest of this check:

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Order Tester","email":"ordertester@example.com","password":"password123"}'
```

Copy the `"token"` value from the response, then:

```bash
TOKEN="<paste the token here>"
curl -s -i http://localhost:5000/api/orders/mine -H "Authorization: Bearer $TOKEN"
```

Expected: `HTTP/1.1 200` and `[]` (this brand-new account has no orders yet).

For the admin-facing populate check, log in with your local admin account (the `ADMIN_EMAIL`/`ADMIN_PASSWORD` you set in `server/.env`):

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<your ADMIN_EMAIL>","password":"<your ADMIN_PASSWORD>"}'
```

Copy that token, then:

```bash
ADMIN_TOKEN="<paste the admin token here>"
curl -s http://localhost:5000/api/orders -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: `HTTP/1.1 200` and a JSON array. If any orders already exist in your local DB, each one's `"user"` field is now either `null` or a populated object like `{"_id":"...","name":"...","email":"..."}` — not a bare id string.

The full round trip (an authenticated checkout actually creating an order tagged with the account) is verified in Task 6, once the frontend can drive it end-to-end.

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Order.js server/src/controllers/orderController.js server/src/routes/orderRoutes.js
git commit -m "feat(server): link orders to accounts, require auth on checkout, add order history endpoint"
```

---

### Task 3: Admin customer endpoints

**Files:**
- Create: `server/src/controllers/userController.js`
- Create: `server/src/routes/userRoutes.js`
- Modify: `server/src/app.js`

**Interfaces:**
- Consumes: `protect`, `adminOnly` from `server/src/middleware/auth.js`; `Order` model from Task 2.
- Produces: `GET /api/users` (admin only) → `[{ id, name, email, createdAt, orderCount, totalSpent }]`. `GET /api/users/:id` (admin only) → `{ user: { id, name, email, createdAt }, orders: [...] }`.

- [ ] **Step 1: Write the controller**

Create `server/src/controllers/userController.js`:

```js
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import User from "../models/User.js"
import Order from "../models/Order.js"

function toCustomerSummary(user, stats) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    orderCount: stats?.orderCount || 0,
    totalSpent: stats?.totalSpent || 0,
  }
}

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "user" }).sort({ createdAt: -1 })
  const stats = await Order.aggregate([
    { $match: { user: { $ne: null } } },
    { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
  ])
  const statsByUser = new Map(stats.map((s) => [String(s._id), s]))
  res.json(users.map((u) => toCustomerSummary(u, statsByUser.get(String(u._id)))))
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: "user" })
  if (!user) throw new ApiError(404, "Customer not found")

  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 })
  res.json({
    user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    orders,
  })
})
```

- [ ] **Step 2: Wire the routes**

Create `server/src/routes/userRoutes.js`:

```js
import { Router } from "express"
import { listUsers, getUser } from "../controllers/userController.js"
import { protect, adminOnly } from "../middleware/auth.js"

const router = Router()

router.get("/", protect, adminOnly, listUsers)
router.get("/:id", protect, adminOnly, getUser)

export default router
```

- [ ] **Step 3: Mount the route in the app**

In `server/src/app.js`, add the import alongside the other route imports:

```js
import userRoutes from "./routes/userRoutes.js"
```

And mount it alongside the other `app.use("/api/...")` calls:

```js
app.use("/api/users", userRoutes)
```

- [ ] **Step 4: Verify manually**

With the backend running and using the `ADMIN_TOKEN` from Task 2, Step 4:

```bash
curl -s http://localhost:5000/api/users -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: `HTTP 200` and an array including the `testcustomer@example.com` and `ordertester@example.com` accounts created in Task 1/2, each with `orderCount: 0` and `totalSpent: 0`.

Copy one customer's `"id"` from that response:

```bash
curl -s -i http://localhost:5000/api/users/<paste-id-here> -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: `HTTP 200` and `{"user":{...},"orders":[]}`.

Confirm non-admins are rejected — reuse the plain customer `$TOKEN` from Task 2:

```bash
curl -s -i http://localhost:5000/api/users -H "Authorization: Bearer $TOKEN"
```

Expected: `HTTP/1.1 403` and `{"message":"Admin access required"}`.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/userController.js server/src/routes/userRoutes.js server/src/app.js
git commit -m "feat(server): add admin endpoints to list customers and their orders"
```

---

### Task 4: `AuthContext.register()` + shared token key

**Files:**
- Modify: `src/context/AuthContext.jsx`
- Modify: `src/lib/api.js`

**Interfaces:**
- Consumes: `POST /auth/register` from Task 1.
- Produces: `useAuth()` now also returns `register(name, email, password): Promise<user>`, alongside the existing `user`, `loading`, `login`, `logout`. The localStorage token key used everywhere is now `rs_token` (was `rs_admin_token`).

- [ ] **Step 1: Update `AuthContext.jsx`**

Replace the full contents of `src/context/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { api } from "../lib/api"

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
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
```

- [ ] **Step 2: Update `lib/api.js`**

Replace the full contents of `src/lib/api.js`:

```js
import axios from "axios"

export const api = axios.create({ baseURL: "/api" })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rs_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Centralised 401 handling: drop the stale token and let route guards
// (RequireAuth / ProtectedAdminRoute) redirect via useAuth's consumers on
// next render.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("rs_token")
    }
    return Promise.reject(error)
  }
)

export function apiErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong"
}
```

- [ ] **Step 3: Verify manually**

Confirm the old key is gone and the new one is used consistently:

```bash
grep -rn "rs_admin_token" "src"
```

Expected: no output (no matches).

```bash
grep -rn "rs_token" src/context/AuthContext.jsx src/lib/api.js
```

Expected: matches in both files.

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.jsx src/lib/api.js
git commit -m "feat(client): add AuthContext.register and share the auth token key with customer sessions"
```

---

### Task 5: Customer Login and Register pages

**Files:**
- Create: `src/pages/Login.jsx`
- Create: `src/pages/Register.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useAuth()` (`user`, `loading`, `login`, `register`) from Task 4.
- Produces: routes `/login` and `/register`, rendered inside the existing `PublicLayout`.

- [ ] **Step 1: Create `src/pages/Login.jsx`**

```jsx
import { useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { LogIn } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      toast.success("Welcome back!")
      navigate(location.state?.from || "/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container-rs flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-ink-850 p-7">
        <h1 className="mb-1 text-center font-display text-xl font-bold text-cloud-100">Log In</h1>
        <p className="mb-6 text-center text-sm text-cloud-400">Sign in to your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <LogIn size={16} /> {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-cloud-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-brand-300 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create `src/pages/Register.jsx`**

```jsx
import { useState } from "react"
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom"
import { UserPlus } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import { apiErrorMessage } from "../lib/api"

export default function Register() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={location.state?.from || "/"} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setSubmitting(true)
    try {
      await register(name, email, password)
      toast.success("Account created!")
      navigate(location.state?.from || "/", { replace: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container-rs flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-ink-850 p-7">
        <h1 className="mb-1 text-center font-display text-xl font-bold text-cloud-100">Create Account</h1>
        <p className="mb-6 text-center text-sm text-cloud-400">Register to check out and track your orders.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Full Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-cloud-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-ink-800 px-3.5 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:border-brand-500/60 focus:outline-none"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <UserPlus size={16} /> {submitting ? "Creating…" : "Create Account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-cloud-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-300 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Add the routes**

In `src/App.jsx`, the existing admin login is imported as `Login` from `./admin/pages/Login` — alias the new customer page to avoid a name collision. Update the imports:

```jsx
import CustomerLogin from "./pages/Login"
import Register from "./pages/Register"
```

Add these alongside the other imports near the top of the file (order doesn't matter, but keep them grouped with the other `./pages/*` imports).

Then, inside the `<Route element={<PublicLayout />}>` block, add two routes just before the `path="*"` catch-all:

```jsx
              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/register" element={<Register />} />
```

- [ ] **Step 4: Verify manually**

Start both dev servers: `npm run server` (backend) and, in a second terminal, `npm run dev` (frontend). Open `http://localhost:5173/register` in a browser.

- Submit the form with a brand-new email/name/password (6+ characters). Expected: a "Account created!" toast, and the browser navigates to `/`.
- Navigate to `http://localhost:5173/login` directly, submit with the same credentials. Expected: "Welcome back!" toast, navigates to `/`.
- Try registering with an email you already used. Expected: an error toast reading "Email already registered".

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.jsx src/pages/Register.jsx src/App.jsx
git commit -m "feat(client): add customer login and register pages"
```

---

### Task 6: Gate checkout behind login, add order history

**Files:**
- Create: `src/components/RequireAuth.jsx`
- Create: `src/pages/AccountOrders.jsx`
- Modify: `src/hooks/useOrders.js`
- Modify: `src/pages/Checkout.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useAuth()` from Task 4; `GET /orders/mine` from Task 2.
- Produces: `RequireAuth` (route wrapper — redirects to `/login` with `state.from` when logged out, otherwise renders `<Outlet />`), `useMyOrders()` hook, `/account/orders` route, `/checkout` now behind `RequireAuth`.

- [ ] **Step 1: Create `src/components/RequireAuth.jsx`**

```jsx
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="container-rs py-24 text-center text-cloud-400">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
```

- [ ] **Step 2: Add `useMyOrders` to `src/hooks/useOrders.js`**

Update the comment on `useCreateOrder` (it's no longer a guest/public endpoint) and add the new hook. The full file should read:

```js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders")).data,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => (await api.put(`/orders/${id}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}

// Requires login — the auth token is attached automatically by the axios interceptor.
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload) => (await api.post("/orders", payload)).data,
  })
}

// Public — order status lookup by id.
export function useTrackOrder(id) {
  return useQuery({
    queryKey: ["order-track", id],
    queryFn: async () => (await api.get(`/orders/${id}/track`)).data,
    enabled: Boolean(id),
  })
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => (await api.get("/orders/mine")).data,
  })
}
```

- [ ] **Step 3: Create `src/pages/AccountOrders.jsx`**

```jsx
import { Link } from "react-router-dom"
import { useMyOrders } from "../hooks/useOrders"
import { formatINR } from "../lib/currency"

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-sky-500/15 text-sky-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-400",
}

export default function AccountOrders() {
  const { data: orders, isLoading } = useMyOrders()

  return (
    <section className="container-rs py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-cloud-100">My Orders</h1>

      {isLoading && <p className="text-sm text-cloud-500">Loading your orders…</p>}

      {!isLoading && (!orders || orders.length === 0) && (
        <p className="text-sm text-cloud-500">You haven't placed any orders yet.</p>
      )}

      {!isLoading && orders?.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/order/${order._id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-ink-850 p-5 transition hover:border-brand-500/40"
            >
              <div>
                <div className="font-mono text-xs text-cloud-500">#{order._id.slice(-8)}</div>
                <div className="text-sm text-cloud-300">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-cloud-100">{formatINR(order.total)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                  {order.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Pre-fill Checkout from the logged-in account**

In `src/pages/Checkout.jsx`, change the React import and add the auth hook + a pre-fill effect. The top of the file becomes:

```jsx
import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Copy, Check, QrCode } from "lucide-react"
import toast from "react-hot-toast"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { usePaymentSettings } from "../hooks/usePaymentSettings"
import { useCreateOrder } from "../hooks/useOrders"
import { apiErrorMessage } from "../lib/api"
import { formatINR } from "../lib/currency"

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  const { data: settings, isLoading: loadingSettings } = usePaymentSettings()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const [paymentReference, setPaymentReference] = useState("")
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }))
  }, [user])

  if (items.length === 0 && !submitted) {
    return <Navigate to="/cart" replace />
  }
```

The rest of `Checkout.jsx` (from `function setField` onward) stays exactly as it is today — no other changes.

- [ ] **Step 5: Wire the routes**

In `src/App.jsx`:

- Import the new pieces alongside the existing imports:

```jsx
import RequireAuth from "./components/RequireAuth"
import AccountOrders from "./pages/AccountOrders"
```

- Remove the existing top-level `<Route path="/checkout" element={<Checkout />} />` line from inside the `<Route element={<PublicLayout />}>` block.
- In its place, add a nested `RequireAuth` group (still inside the `PublicLayout` route, so the header/footer still render) — put it right before the `/login` and `/register` routes added in Task 5:

```jsx
              <Route element={<RequireAuth />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account/orders" element={<AccountOrders />} />
              </Route>
```

The `path="*"` catch-all route must remain the last child of the `PublicLayout` route.

- [ ] **Step 6: Verify manually — full flow**

With both dev servers running and logged out (clear localStorage or use a private/incognito window):

1. Add a product to the cart and go to `/cart`, then click through to `/checkout`. Expected: redirected to `/login`.
2. Register a new account from that login page's "Register" link. Expected: after registering, you land back on `/checkout` (not `/` — this confirms `state.from` round-tripped through registration too, since `Register.jsx` also reads `location.state?.from`).
3. On the checkout form, confirm the Name and Email fields are already filled in with the account's name/email.
4. Complete the checkout (fill phone + a payment reference, submit). Expected: "Order submitted!" toast, redirected to `/order/:id`.
5. Navigate to `http://localhost:5173/account/orders`. Expected: the order just placed appears in the list, linking back to the same `/order/:id` page.
6. Log out (there's no header UI for this yet — for this check, run `localStorage.removeItem("rs_token")` in the browser devtools console and refresh), then visit `/account/orders` directly. Expected: redirected to `/login`.

- [ ] **Step 7: Commit**

```bash
git add src/components/RequireAuth.jsx src/pages/AccountOrders.jsx src/hooks/useOrders.js src/pages/Checkout.jsx src/App.jsx
git commit -m "feat(client): require login for checkout, add customer order history"
```

---

### Task 7: Header and mobile menu reflect login state

**Files:**
- Modify: `src/components/layout/Header.jsx`
- Modify: `src/components/layout/MobileMenu.jsx`

**Interfaces:**
- Consumes: `useAuth()` (`user`, `logout`) from Task 4.

- [ ] **Step 1: Update `Header.jsx`**

Replace the full contents of `src/components/layout/Header.jsx`:

```jsx
import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, Heart, ShoppingCart, ChevronDown, Menu, User, Sun, Moon, LogOut, Package } from "lucide-react"
import Logo from "../ui/Logo"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"

function ActionIcon({ icon: Icon, count, to }) {
  return (
    <Link
      to={to}
      className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 sm:h-10 sm:w-10"
    >
      <Icon size={19} className="sm:hidden" />
      <Icon size={20} className="hidden sm:block" />
      {count != null && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-0.5 flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-2.5 py-2 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow sm:ml-1 sm:px-5 sm:py-2.5"
      >
        <User size={16} />
        <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-ink-800 py-1.5 shadow-xl">
          <Link
            to="/account/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-cloud-200 hover:bg-ink-700 hover:text-cloud-100"
          >
            <Package size={15} /> My Orders
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-cloud-200 hover:bg-ink-700 hover:text-cloud-100"
          >
            <LogOut size={15} /> Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header({ onMenuClick }) {
  const { count } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)

  // Sync theme status on component mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDark(true)
    }
  }

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <div className="border-b border-white/5 bg-ink-900/95">
      <div className="container-rs flex h-[72px] min-w-0 items-center gap-1.5 sm:gap-3">
        <button
          onClick={onMenuClick}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 sm:h-10 sm:w-10 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Logo />

        {/* Search with category selector */}
        <div className="ml-2 hidden max-w-[560px] flex-1 items-center rounded-xl border border-white/10 bg-ink-800 focus-within:border-brand-500/60 lg:flex">
          <button className="flex shrink-0 items-center gap-1.5 border-r border-white/10 px-4 py-2.5 text-sm font-medium text-cloud-300 transition hover:text-cloud-100">
            All Categories <ChevronDown size={15} />
          </button>
          <input
            type="text"
            placeholder="Search for products, themes, plugins, tools..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none"
          />
          <button className="m-1 grid h-9 w-10 shrink-0 place-items-center rounded-lg bg-brand-gradient text-white">
            <Search size={18} />
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <ActionIcon icon={Heart} count={3} to="/wishlist" />
          <ActionIcon icon={ShoppingCart} count={count} to="/cart" />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-cloud-300 transition hover:bg-ink-800 hover:text-cloud-100 sm:h-10 sm:w-10 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user ? (
            <AccountMenu user={user} onLogout={handleLogout} />
          ) : (
            <Link
              to="/login"
              className="ml-0.5 flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-2.5 py-2 text-sm font-semibold text-white transition hover:opacity-95 glow-shadow sm:ml-1 sm:px-5 sm:py-2.5"
            >
              <User size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Login / Register</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `MobileMenu.jsx`**

Replace the full contents of `src/components/layout/MobileMenu.jsx`:

```jsx
import { useState, useEffect } from "react"
import { NavLink, Link, useNavigate } from "react-router-dom"
import { X, Search, Heart, ShoppingCart, User, Sun, Moon, LogOut, Package } from "lucide-react"
import { navLinks } from "../../data/site"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"

export default function MobileMenu({ open, onClose }) {
  const { count } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)

  // Sync theme status on component mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDark(true)
    }
  };

  function handleLogout() {
    onClose()
    logout()
    navigate("/")
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm -translate-x-full flex-col bg-ink-900 transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <span className="font-display text-lg font-bold text-cloud-100">Menu</span>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/8 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-3 py-2.5">
            <Search size={16} className="text-cloud-500" />
            <input
              type="text"
              placeholder="Search products…"
              className="flex-1 bg-transparent text-sm text-cloud-100 placeholder:text-cloud-500 focus:outline-none"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "block rounded-lg px-3.5 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-ink-800 text-cloud-100" : "text-cloud-400 hover:bg-ink-800 hover:text-cloud-100",
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/8 p-4">
          <Link
            to="/wishlist"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
          >
            <Heart size={17} /> Wishlist
          </Link>
          <Link
            to="/cart"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
          >
            <ShoppingCart size={17} /> Cart {count > 0 && `(${count})`}
          </Link>

          {/* Mobile Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100 cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun size={17} /> Light Mode
              </>
            ) : (
              <>
                <Moon size={17} /> Dark Mode
              </>
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/account/orders"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
              >
                <Package size={17} /> My Orders
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
              >
                <LogOut size={17} /> Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-cloud-400 hover:bg-ink-800 hover:text-cloud-100"
            >
              <User size={17} /> Login / Register
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verify manually**

With both dev servers running:

1. Logged out, load any storefront page. Expected: header button reads "Login / Register" and is a real link — clicking it navigates to `/login` (this is the original reported bug, now fixed).
2. Log in. Expected: the button is replaced by the account's first name. Click it — a dropdown opens with "My Orders" and "Log Out".
3. Click "My Orders" — navigates to `/account/orders` and the dropdown closes.
4. Click the account name again, then "Log Out" — you're signed out, navigated to `/`, and the header reverts to "Login / Register".
5. Shrink the viewport (or use devtools mobile emulation) to trigger the mobile menu. Confirm the same logged-in/out states appear correctly in the slide-out menu, and that "My Orders"/"Log Out"/"Login / Register" all close the menu when clicked.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.jsx src/components/layout/MobileMenu.jsx
git commit -m "feat(client): show account state and reflect login/logout in the storefront header"
```

---

### Task 8: Admin — Customers list page

**Files:**
- Create: `src/hooks/useUsers.js`
- Create: `src/admin/pages/customers/CustomerList.jsx`
- Modify: `src/admin/layout/AdminSidebar.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `GET /users` from Task 3; `DataTable` from `src/admin/components/DataTable.jsx`; `formatINR` from `src/lib/currency.js`.
- Produces: `useCustomers()` hook, `/admin/customers` route, sidebar link.

- [ ] **Step 1: Create `src/hooks/useUsers.js`**

```js
import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await api.get("/users")).data,
  })
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => (await api.get(`/users/${id}`)).data,
    enabled: Boolean(id),
  })
}
```

- [ ] **Step 2: Create `src/admin/pages/customers/CustomerList.jsx`**

```jsx
import { useNavigate } from "react-router-dom"
import { useCustomers } from "../../../hooks/useUsers"
import { formatINR } from "../../../lib/currency"
import DataTable from "../../components/DataTable"

export default function CustomerList() {
  const { data: customers, isLoading } = useCustomers()
  const navigate = useNavigate()

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "orderCount", label: "Orders" },
    { key: "totalSpent", label: "Total Spent", render: (c) => formatINR(c.totalSpent) },
    { key: "createdAt", label: "Joined", render: (c) => new Date(c.createdAt).toLocaleDateString() },
  ]

  return (
    <DataTable
      columns={columns}
      rows={(customers || []).map((c) => ({ ...c, _id: c.id }))}
      loading={isLoading}
      emptyMessage="No registered customers yet."
      actions={(c) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/customers/${c.id}`)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-cloud-200 hover:border-brand-500/50"
        >
          View
        </button>
      )}
    />
  )
}
```

(`DataTable` keys rows on `_id` by default — `/users` returns `id`, so each row is spread with an added `_id: c.id` alias rather than modifying the shared `DataTable` component.)

- [ ] **Step 3: Add the sidebar link**

In `src/admin/layout/AdminSidebar.jsx`, add the `Users` icon to the import and a new entry to the `links` array (after "Orders"):

```jsx
import { LayoutDashboard, Package, Grid3x3, Building2, ShoppingCart, Users, CreditCard, X } from "lucide-react"
```

```jsx
const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Grid3x3 },
  { to: "/admin/brands", label: "Brands", icon: Building2 },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings", label: "Payment Settings", icon: CreditCard },
]
```

- [ ] **Step 4: Wire the route**

In `src/App.jsx`, import the new page:

```jsx
import CustomerList from "./admin/pages/customers/CustomerList"
```

Add the route inside the existing `<Route path="/admin" element={<AdminLayout />}>` block (order among siblings doesn't matter, but keep it near `orders`):

```jsx
                <Route path="customers" element={<CustomerList />} />
```

- [ ] **Step 5: Verify manually**

Log into `/admin/login` with your local admin credentials, then visit `/admin/customers`. Expected: a "Customers" link in the sidebar, and a table listing every account registered during Tasks 5–7 (name, email, order count, total spent, joined date). The customer who completed checkout in Task 6 should show `1` order and a non-zero total spent.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useUsers.js src/admin/pages/customers/CustomerList.jsx src/admin/layout/AdminSidebar.jsx src/App.jsx
git commit -m "feat(admin): add customers list page"
```

---

### Task 9: Admin — Customer detail page

**Files:**
- Create: `src/admin/pages/customers/CustomerDetail.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `useCustomer(id)` from Task 8; `GET /users/:id` from Task 3.
- Produces: `/admin/customers/:id` route.

- [ ] **Step 1: Create `src/admin/pages/customers/CustomerDetail.jsx`**

```jsx
import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useCustomer } from "../../../hooks/useUsers"
import { formatINR } from "../../../lib/currency"
import DataTable from "../../components/DataTable"

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-400",
  paid: "bg-sky-500/15 text-sky-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-400",
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { data, isLoading } = useCustomer(id)

  const columns = [
    { key: "_id", label: "Order ID", render: (o) => <span className="font-mono text-xs">{o._id.slice(-8)}</span> },
    { key: "items", label: "Items", render: (o) => o.items.length },
    { key: "total", label: "Total", render: (o) => formatINR(o.total) },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[o.status]}`}>{o.status}</span>
      ),
    },
    { key: "createdAt", label: "Date", render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ]

  if (isLoading) return <p className="text-cloud-500">Loading…</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-cloud-400 hover:text-cloud-100"
      >
        <ArrowLeft size={15} /> Back to Customers
      </Link>
      <div className="rounded-2xl border border-white/8 bg-ink-850 p-6">
        <h1 className="font-display text-xl font-bold text-cloud-100">{data.user.name}</h1>
        <p className="text-sm text-cloud-400">{data.user.email}</p>
        <p className="mt-1 text-xs text-cloud-500">Joined {new Date(data.user.createdAt).toLocaleDateString()}</p>
      </div>
      <DataTable
        columns={columns}
        rows={data.orders}
        loading={false}
        emptyMessage="No orders from this customer yet."
      />
    </div>
  )
}
```

- [ ] **Step 2: Wire the route**

In `src/App.jsx`, import the new page:

```jsx
import CustomerDetail from "./admin/pages/customers/CustomerDetail"
```

Add the route right after `customers` inside the same `/admin` route block from Task 8:

```jsx
                <Route path="customers/:id" element={<CustomerDetail />} />
```

- [ ] **Step 3: Verify manually**

From `/admin/customers`, click "View" on the customer who completed a checkout in Task 6. Expected: their name, email, joined date, and a table with the one order they placed (correct item count, total, status "pending"). Click "Back to Customers" — returns to the list.

- [ ] **Step 4: Commit**

```bash
git add src/admin/pages/customers/CustomerDetail.jsx src/App.jsx
git commit -m "feat(admin): add customer detail page with their order history"
```

---

### Task 10: Admin — show linked account on the Orders table

**Files:**
- Modify: `src/admin/pages/orders/OrderList.jsx`

**Interfaces:**
- Consumes: `order.user` (now populated as `{ _id, name, email }` or `null`) from Task 2.

- [ ] **Step 1: Add the Account column**

In `src/admin/pages/orders/OrderList.jsx`, add the `Link` import:

```jsx
import { Link } from "react-router-dom"
```

Insert a new column into the `columns` array, right after the existing `customer` column:

```jsx
    {
      key: "account",
      label: "Account",
      render: (o) =>
        o.user ? (
          <Link to={`/admin/customers/${o.user._id}`} className="text-brand-300 hover:underline">
            {o.user.name}
          </Link>
        ) : (
          <span className="text-cloud-600">Guest</span>
        ),
    },
```

- [ ] **Step 2: Verify manually**

Visit `/admin/orders`. Expected: the order placed in Task 6 now shows an "Account" column with the customer's name, linking to their `/admin/customers/:id` page. Any pre-existing orders from before this feature (if your local DB has any) show "Guest" in that column instead.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/orders/OrderList.jsx
git commit -m "feat(admin): show which account placed each order"
```
