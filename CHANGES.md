# Enhancements Applied — Indtrans Freight Solutions

This document describes **what was changed and why** in this enhanced build.
Business logic, API routes, entity table names, company details, PAN/GST, bank
info and the frontend domain/route structure are **unchanged**.

---

## 1. Uploaded files (vehicle RC / insurance / permit, driver licence, gallery)

### Problem
- `WebConfig` only exposed `/uploads/gallery/**` as static resources, so vehicle
  documents, driver licences, and any future uploads returned 404 when viewed.
- Frontend pages `Vehicles.tsx` and `Drivers.tsx` built links like
  `http://localhost:8080/uploads/vehicles/rc/xxx.pdf`, but the backend
  context-path is `/api`, so the real URL is `/api/uploads/vehicles/rc/xxx.pdf`.
- `Landing.tsx` and `GalleryManagement.tsx` hard-coded `http://localhost:8080/api`,
  breaking `.env.production` (which uses `/api`).

### Fix
- `backend/.../config/WebConfig.java` now serves **every** file under
  `uploads/` via `/uploads/**`.
- All vehicle/driver document view buttons, the landing-page gallery, and the
  admin gallery grid now use a single helper `getFileUrl(path)` exported from
  `frontend/src/services/api.ts`, which prepends `VITE_API_BASE_URL` correctly
  in both development and production.
- The vehicle list now also shows a **Permit (PRM)** document button alongside
  RC and INS — previously the permit document was uploaded but never viewable
  from the list.

## 2. Receipt upload (new)

### Problem
Billing had no way to attach a proof-of-payment receipt.

### Fix — Backend
- `Billing` entity: new column `receipt_path` (`VARCHAR(255)`, nullable).
- `BillingController`:
  - `POST /api/billing/{id}/receipt` (multipart, field `receipt`) stores the
    file in `uploads/receipts/` and auto-marks the bill as **PAID** with
    `paidAmount = amount`.
  - `DELETE /api/billing/{id}/receipt` removes the stored file.
- `FileUploadUtil.saveToFolder(...)` — generic helper used by receipts and
  easily re-usable for any future upload feature.
- Flyway migration `V1__add_billing_receipt_path.sql` provided for production
  DBs where schema changes must be tracked.
- `application.properties`: `ddl-auto` changed from `validate` to `update`, and
  Flyway disabled by default (`spring.flyway.enabled=false`) because no
  migration files shipped previously — turning it on would fail startup on
  existing databases. Enable it later once you adopt the migration workflow.

### Fix — Frontend (`pages/Billing.tsx`)
- View-Bill modal now contains a **Payment Receipt** section:
  - If no receipt is attached → drag-and-drop style upload area (PDF/JPG/PNG).
  - If a receipt exists → *View*, *Replace* and *Remove* buttons.
- The billing list shows an orange document icon next to bills that already
  have a receipt, giving one-click access.

## 3. Gallery management → landing-page gallery

- Gallery upload already worked; the visibility problem was the URL prefix
  (see section 1). Both the admin grid and the public landing gallery now use
  `getFileUrl()` so images render both in dev (`localhost:8080/api`) and prod
  (same-origin `/api`).

## 4. Misc

- Removed duplicated `BACKEND_URL` constants from Landing / GalleryManagement;
  single source of truth now lives in `frontend/src/services/api.ts`.
- Vehicle document column now shows a **No docs** placeholder when nothing is
  uploaded instead of rendering an empty cell.

## 5. Toast notifications (round 2)

- Added `react-hot-toast`. `<Toaster />` is mounted in `App.tsx`.
- `frontend/src/services/notify.ts` exports two helpers:
  - `notify(message)` — replaces every `alert()` call (54 swaps across 12 pages)
    and auto-classifies the toast (success / error / info) from keywords in the
    message.
  - `notifyFormErrors(errors)` — renders react-hook-form errors (or a plain
    object) as a consolidated error toast. Wired into Vehicles, Drivers,
    Login, and UserManagement's create-user dialog.

## 6. Docker, compose, reverse proxy

- Multi-stage `Dockerfile` builds the React bundle with Vite, compiles the
  Spring Boot jar with Maven, and ships a minimal JRE runtime containing both
  (the SPA is copied into `classpath:/static` so Spring Boot serves it).
- `docker-compose.yml` runs PostgreSQL, the app container and an `nginx`
  reverse proxy that maps `http://<host>/` to the SPA and
  `http://<host>/api/*` to the backend — one port, same origin, zero CORS
  headaches.
- `.env.example` documents all secrets (DB creds, `APP_JWT_SECRET`, allowed
  origins). `SecurityConfig` now reads allowed CORS origins from
  `app.cors.allowed-origins` (overridable via `APP_CORS_ALLOWED_ORIGINS` env).
- `SMOKE_TEST.md` contains a complete curl-based post-boot checklist.

## 7. First-login password change + employee creation

- New column `employees.must_change_password` (flagged `TRUE` for the seeded
  admin and for every user created from the UI).
- New `POST /api/auth/change-password` endpoint. Validates the current
  password, enforces a minimum policy (≥ 8 chars, mixed case, digit), and
  clears the flag on success.
- Login response now carries `mustChangePassword`. The login page detects the
  flag and redirects the user to a brand-new `/admin/change-password`
  screen (reachable on-demand too if the user wants to rotate).
- `UserManagement` create flow now runs its own client-side validation and
  tells the admin that the new user will choose their password on first login.
- Flyway migration `V2__add_must_change_password.sql` is provided for teams
  that switch Flyway back on.

## 8. Route guard (`<PrivateRoute>`)

- New `frontend/src/components/PrivateRoute.tsx` wraps every protected route.
- Behaviour:
  - Unauthenticated visitor → redirected to `/admin/login` (with the original
    path preserved in `location.state.from` so you can restore it later).
  - Authenticated user with `mustChangePassword === true` → redirected to
    `/admin/change-password` (the only protected route they can reach until
    they set a new password).
  - Role-scoped routes: `/admin/users` is wrapped with
    `<PrivateRoute requiredRole="ADMIN">`. Non-admins bounce to `/dashboard`.
- Deep links no longer bypass the first-login password-change flow — pasting
  `/admin/billing` while `mustChangePassword` is true now hops to the
  change-password screen instead of the billing list.

## 9. Auth restore race fix + shared Sidebar nav

- `useAuth` now exposes a `loading` flag and keeps it `true` until the
  mount-time localStorage restore has finished. `PrivateRoute` shows a
  spinner during that brief window instead of redirecting to `/admin/login`.
  This removes the "clicking Back to Dashboard logs me out" regression you
  hit on a full-page reload.
- New `frontend/src/components/Sidebar.tsx` — single nav panel reused across
  every protected page. It uses React Router `<NavLink>` so switching tabs is
  an instant in-app navigation (no full reload, no auth flicker).
- Active-route highlight, role-aware menu (admin-only items hidden from
  employees), per-user footer with "Change password" and a real "Logout"
  button that calls `useAuth().logout()`.
- All 12 admin pages (`Dashboard`, `Customers`, `Transporters`, `Vehicles`,
  `Drivers`, `VHC`, `GCN`, `ViewGCN`, `Billing`, `GalleryManagement`,
  `UserManagement`) have their inline `<aside>` blocks replaced with
  `<Sidebar />`. No more "Back to Dashboard" stub buttons — every module is
  one click away from anywhere.

## 10. Public gallery endpoint auth fix

- `GalleryImageController.getAllImages()` no longer carries the
  `@PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")` annotation. The URL was
  already `permitAll()` in `SecurityConfig`, but `@EnableMethodSecurity`
  re-checked the method annotation and rejected the anonymous request from
  the public landing page → users saw "No gallery images available" even
  after admins uploaded photos. The admin-only list (`/gallery/admin`) and
  all write operations remain guarded.

---

## How to run

### Backend (Spring Boot + PostgreSQL)
1. Ensure PostgreSQL is running locally and the database `indtrans` exists
   (or override the JDBC URL with `SPRING_DATASOURCE_URL`).
2. Update `backend/src/main/resources/application.properties` if your PostgreSQL
   user/password differ (defaults: `postgres` / env-provided password).
3. Run:
   ```
   cd backend
   ./mvnw spring-boot:run
   ```
   Backend listens on `http://localhost:8080/api`.

### Frontend (React + Vite)
```
cd frontend
npm install          # or yarn / pnpm
npm run dev          # http://localhost:5173
npm run build        # dist/ for production
```

For production, set `VITE_API_BASE_URL` in `.env.production` to the public
`/api` path of your deployed backend (already set to `/api` for same-origin
hosting).

---

## Deployment notes

You can host this on any Java-capable host (Render, Railway, AWS Elastic
Beanstalk, any VPS with JDK 17+). Build the backend jar with
`./mvnw clean package` and the frontend with `npm run build`; serve the
`frontend/dist/` output from any static host (or behind the same reverse
proxy that fronts the Spring Boot jar, so `/api/*` reaches Java and
everything else serves the SPA).

**Note from the builder:** this environment is not Java-capable, so the jar
has not been compiled here. The source changes were made without running
`./mvnw compile`. Please run that locally once to confirm no syntax issues
surface on your JDK.
