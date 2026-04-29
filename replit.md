# Indtrans Freight Solutions - Transport Management System

A full-stack transport management application for Indtrans Freight Solutions LLP.

## Stack
- **Backend**: Spring Boot 3 (Java 21), Spring Security + JWT, Spring Data JPA / Hibernate.
  - Runtime DB: PostgreSQL (`SPRING_DATASOURCE_URL`, defaults to `jdbc:postgresql://localhost:5432/indtrans`).
  - Test DB: H2 in PostgreSQL compatibility mode (set inline in `IndtransBackendApplicationTests`).
- **Frontend**: React 19 + Vite 8 (rolldown) + TypeScript, TanStack Query, React Router 7, Tailwind CSS, react-hot-toast, lucide-react icons.
- **Build tooling**: Maven for backend, pnpm/npm for frontend.

## Architecture
```
backend/   -> Spring Boot REST API exposed at http://localhost:8080/api
frontend/  -> Vite dev server on :5000, proxies /api and /uploads to :8080
dev.sh     -> Boots backend in background then runs vite in foreground (workflow entry)
```

The Vite proxy means frontend code only ever talks to relative `/api/...` URLs;
the same wiring works in production behind any reverse proxy.

## Permission system
- Canonical shape stored in `Employee.permissionsJson`:
  ```json
  {
    "customers":    {"view": true,  "add": true,  "edit": false, "delete": false},
    "transporters": {"view": true,  "add": false, "edit": false, "delete": false},
    "tracking":     {"view": true,  "add": true,  "edit": false, "delete": false}
  }
  ```
- Modules: `customers`, `transporters`, `vehicles`, `drivers`, `vhc`, `gcn`, `tracking`, `billing`, `gallery`. (`users` is admin-only.)
- Backend gate: `@PreAuthorize("@perm.has('module','action')")` on every controller method, using `PermissionService` (`@Component("perm")`). Admins bypass all checks.
- Frontend gate: `<PrivateRoute requiredPermission={{ module, action }}>` plus `useAuth().hasPermission(...)` and `hasAnyPermission(...)` for menu filtering.

## GCN Tracking
- **Public lookup** - `GET /api/public/tracking/{gcnNumber}` (no auth). Returns shipment metadata + ordered timeline.
- **Public UI** - `/track` and `/track/:gcnNumber` (`pages/TrackingPublic.tsx`). Hero search box on the landing page (`#track`).
- **Admin** - `/admin/tracking` (`pages/Tracking.tsx`). Lists every GCN, lets users with `tracking.add` post status updates and (with `delete`) remove them.
- **Status codes**: `BOOKED`, `PICKED_UP`, `IN_TRANSIT`, `REACHED_HUB`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`, `RETURNED`.

## Default credentials (dev)
- **Admin** - `operations@indtransfreightsolutions.com` / `Indtrans 1234`
- The admin is forced through `/admin/change-password` on first login.
- New employees created from `/admin/users` start with **zero** permissions; an admin must grant them per-module access.

## Local run
```bash
# Single-command dev (backend expects PostgreSQL + frontend on :5000):
bash dev.sh
```
Open http://localhost:5000 and use `/admin/login` to reach the dashboard.

Before running locally, make sure PostgreSQL is available and the default
database/user in `backend/src/main/resources/application.properties` exist, or
override them with `SPRING_DATASOURCE_*`.

To run the backend directly:
```bash
./mvnw -f backend/pom.xml spring-boot:run
```

## Production build
```bash
# Backend jar
cd backend && ./mvnw clean package -DskipTests
# Frontend bundle
cd frontend && pnpm install && pnpm build
```

## Repo layout
```
backend/
  src/main/java/com/indtrans/freight/
    config/        Security, JWT filter, UserDetailsService
    controller/    REST endpoints
    dto/           Request/response payloads
    model/         JPA entities
    repository/    Spring Data interfaces
    security/      PermissionService
    service/       Business logic
  src/main/resources/
    application.properties           (PostgreSQL runtime config)
frontend/
  src/
    components/    Sidebar, PrivateRoute
    hooks/         useAuth
    pages/         Landing, Login, Dashboard, Tracking, UserManagement
    services/      api.ts, notify.ts
dev.sh             Workflow entry - boots backend then runs vite
```
