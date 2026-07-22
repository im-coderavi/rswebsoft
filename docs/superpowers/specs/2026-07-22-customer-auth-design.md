# Customer Login / Register — Design Spec

Date: 2026-07-22

## Problem

The "Login / Register" button in the storefront header (`Header.jsx`, `MobileMenu.jsx`) has no `onClick`/`Link` — it's a static, non-functional button. Investigation showed there is no customer-facing auth at all: only an admin login exists (`/admin/login`, `AuthContext`, `POST /auth/login`), there's no `/auth/register` endpoint, and checkout is fully guest (order comment: *"no accounts this phase"*).

The client wants real customer accounts, orders linked to those accounts, and visibility into customers/orders from the admin panel.

## Goals

1. Customers can register and log in.
2. Checkout requires being logged in (no more guest checkout).
3. Orders are linked to the account that placed them; customers can view their own order history.
4. Admin panel can list registered customers and drill into each customer's orders.

## Non-goals (out of scope for this pass)

- Email verification (no email-sending service exists in this project; explicitly declined).
- Password reset / forgot-password flow.
- Editing profile info (name/email/phone) after registration.
- Migrating/backfilling any pre-existing guest orders to accounts.

## Backend changes

### Auth

- `POST /auth/register` (public, `server/src/routes/authRoutes.js` + `authController.js`): accepts `{ name, email, password }`. Validates all three are present, email not already taken (409 if so), delegates hashing to the existing `User` pre-save hook. Returns `{ token, user }` in the same shape as `/auth/login`, using the same `generateToken`/`toPublicUser` helpers.

### Orders

- `Order` model (`server/src/models/Order.js`): add `user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }` (optional — only unset for orders created before this ships, if any).
- `POST /orders` (`orderRoutes.js`): add `protect` middleware (was public). `createOrder` controller sets `order.user = req.user._id`.
- `GET /orders/mine` (new, `protect` only, no `adminOnly`): returns `Order.find({ user: req.user._id }).sort({ createdAt: -1 })` — powers the customer's own order history.
- `GET /orders` (admin list, unchanged route, already `protect + adminOnly`): add `.populate("user", "name email")` so the admin table can show which account placed each order.
- `GET /orders/:id/track` stays public and unchanged — still the guest-friendly post-purchase receipt/download link.

### Users (admin-facing)

- New `server/src/routes/userRoutes.js` + `userController.js`, mounted at `/users` in `app.js`, both endpoints `protect + adminOnly`:
  - `GET /users`: list users with `role: "user"` — name, email, `createdAt`, order count, total spent (aggregate via `Order.aggregate` grouped by `user`, or a per-user count/sum computed after the user list — implementation detail for the plan).
  - `GET /users/:id`: single user's public fields + `Order.find({ user: id }).sort({ createdAt: -1 })`.

## Frontend changes

### Auth plumbing

- `AuthContext.jsx`: add `register(name, email, password)` (mirrors `login`, calls `POST /auth/register`). Rename the localStorage token key from `rs_admin_token` to `rs_token` (used for both admin and customer sessions now) — update in `AuthContext.jsx` and `lib/api.js` (both the request interceptor and the 401 response interceptor). One-time side effect: any admin currently logged in is signed out after this ships.
- New `src/components/RequireAuth.jsx` (customer-facing equivalent of `admin/ProtectedAdminRoute.jsx`): if `loading`, show a loading state; if no `user`, `<Navigate to="/login" state={{ from: location.pathname }} replace />`; else `<Outlet />`.

### Pages

- `src/pages/Login.jsx` (new, distinct from `admin/pages/Login.jsx`): email/password form, styled consistently with the admin login. On submit success, navigate to `location.state?.from || "/"`. Links to `/register`.
- `src/pages/Register.jsx` (new): name/email/password form (client-side mirrors the model: password min length 6). On success, navigate the same way as Login. Links to `/login`.
- `src/pages/AccountOrders.jsx` (new): behind `RequireAuth`, at `/account/orders`. Lists the logged-in customer's orders (date, item count, total, status), each linking to the existing `/order/:id` receipt page. Uses a new `useMyOrders()` hook in `src/hooks/useOrders.js`.

### Routing (`App.jsx`)

- Add public routes (inside `PublicLayout`): `/login`, `/register`.
- Add a `RequireAuth`-wrapped route group (inside `PublicLayout`) containing `/checkout` (moved under this wrapper) and `/account/orders`.

### Header / navigation

- `Header.jsx` and `MobileMenu.jsx`: replace the static button.
  - Logged out: renders as a `Link` to `/login` (this is the reported bug fix).
  - Logged in: shows the customer's name; clicking opens a small menu (desktop) / inline list (mobile) with "My Orders" (→ `/account/orders`) and "Log out" (calls `logout()`, navigates to `/`).

### Checkout

- `Checkout.jsx`: no longer reachable while logged out (handled by `RequireAuth`). Pre-fill `form.name`/`form.email` from `user` on mount; `phone` remains a manual field (not on the `User` model). Drop any guest-specific copy.

### Admin

- `AdminSidebar.jsx`: add a "Customers" link → `/admin/customers`.
- `src/admin/pages/customers/CustomerList.jsx` (new): `DataTable` of registered customers — name, email, joined date, order count, total spent. Row click navigates to `/admin/customers/:id`.
- `src/admin/pages/customers/CustomerDetail.jsx` (new): customer's name/email/joined date, plus a read-only `DataTable` of their orders (id, items, total, status, date). Status changes stay on the existing `/admin/orders` page — `CustomerDetail` doesn't duplicate that editing UI.
- `admin/pages/orders/OrderList.jsx`: add an "Account" column — the linked customer's name (linking to `/admin/customers/:id`) if `order.user` is populated, else "Guest".
- New `src/hooks/useUsers.js`: `useCustomers()`, `useCustomer(id)`.
- `App.jsx`: add `/admin/customers` and `/admin/customers/:id` under the existing `ProtectedAdminRoute` group.

## Error handling

- Registration: missing fields → 400 with a field-specific message; duplicate email → 409 "Email already registered" (surfaced via existing `apiErrorMessage` + toast pattern used throughout the app).
- Login: unchanged (401 "Invalid email or password").
- `RequireAuth` / checkout redirect: no error state needed — it's a normal redirect, not a failure.

## Testing

No test framework is configured in this project (no jest/vitest in either `package.json`). Verification will be manual, via the dev server in a browser:

- Register a new account, confirm redirect and header state change.
- Log out, log back in.
- Attempt to visit `/checkout` while logged out → redirected to `/login` → after login, lands back on `/checkout`.
- Complete a checkout while logged in → order appears at `/account/orders` and in the admin Orders table with the correct linked account.
- Admin: view `/admin/customers`, drill into a customer, confirm their orders match.
- Confirm existing admin login flow (`/admin/login`) still works after the token-key rename.
