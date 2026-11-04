# LRMS — Architecture & API Contract (single source of truth)

**Important:** This is an independent demo/educational project inspired by Bihar land
administration concepts. It is NOT an official Bihar Government system and must never
be presented as one. No real citizen data. All seed data is fictional demo data,
clearly labelled as demo in the UI.

## Monorepo layout
```
land_revnue/
  frontend/   Vite + React 18 + TypeScript + Tailwind + Recharts + Leaflet
  backend/    Node.js + Express + TypeScript + Prisma + PostgreSQL
              (CORRECTED 2026-11-04 by user: backend is Node.js, NOT ASP.NET Core)
  docs/       ARCHITECTURE.md, API.md, SETUP.md, DEMO_ACCOUNTS.md
  docker-compose.yml  (postgres + api + web, for deployment only)
```

## Roles (exact strings, used by both sides)
`SuperAdmin | DistrictOfficer | CircleOfficer | RevenueEmployee | Amin | Citizen`

## Auth (backend owns truth)
- POST /api/auth/register (Citizen only, name/mobile/email/address; OTP step is
  MOCKED in demo: any 6-digit code verifies — never use in production)
- POST /api/auth/login -> { accessToken (JWT, 60 min), refreshToken, user }
- POST /api/auth/refresh, POST /api/auth/logout (revoke refresh token)
- Passwords: BCrypt. JWT + refresh tokens stored hashed, rotated on use.
- Every protected endpoint requires JWT; role checks via [Authorize(Roles=...)].
- Citizens can only access their own records/applications (userId filter enforced
  server-side, never trusted from the client).

## Core entities (PostgreSQL, EF Core, CreatedAt/UpdatedAt/CreatedBy/UpdatedBy)
Users, Roles, Permissions, UserRoles, Districts, Circles, Mauzas, Villages,
LandRecords, LandOwners, LandOwnershipHistory, JamabandiRecords,
MutationApplications, MutationDocuments, RevenuePayments, RevenueRates,
SurveyRequests, SurveyAssignments, SurveyReports, CertificateApplications,
Certificates, Complaints, LandDisputes, Notifications, AuditLogs.

Key land fields: KhataNumber, KhesraNumber, PlotNumber, Mauza, Village, Circle,
District, AreaInDecimal, LandClassification (Agricultural/Residential/Commercial/
Homestead/Other), Owner details, ownership history.

## API surface (backend must implement; frontend must call these, no other base shape)
- GET /api/dashboard/admin-stats  (computed from DB, never hardcoded)
- GET /api/dashboard/citizen-stats
- GET /api/dashboard/revenue-monthly, /api/dashboard/mutation-stats,
  /api/dashboard/district-records, /api/dashboard/approval-trends
- CRUD: /api/land-records, /api/jamabandi, /api/mutations (+ /{id}/approve|reject|
  request-documents|assign), /api/revenue (+ /rates, /{id}/receipt),
  /api/surveys (+ /assign, /report), /api/certificates (+ /{id}/issue),
  /api/complaints (+ /disputes), /api/admin/users (+ /{id}/activate|deactivate),
  /api/admin/masters (districts/circles/mauzas/villages),
  /api/reports/{district|revenue|mutation|ownership|survey|employee} (+ ?format=pdf|xlsx),
  /api/notifications, /api/audit-logs
- All list endpoints: ?search=&district=&circle=&status=&page=&pageSize=&sort=
  returning { items, total, page, pageSize }.
- Statuses (exact): Pending, UnderReview, Approved, Rejected, Paid, Unpaid,
  Assigned, Completed, Resolved, InProgress.
- Errors: { error: { code, message } } with proper HTTP codes. Validation via
  FluentValidation/DataAnnotations. Rate limiting, file type+size validation
  (PDF/JPG/PNG, max 5 MB), audit log on every admin action.
- Mutation approve MUST run in a DB transaction: update LandRecord owner +
  Jamabandi + LandOwnershipHistory + Mutation status + AuditLog atomically.
- Payments: Razorpay TEST MODE only, configurable via env. Never mark Paid
  without verified webhook signature (Razorpay signature verification).
  Frontend payment page must show "Test mode — no real money" banner.

## Frontend
- Two portals, one app, route-gated by role:
  /login, /register, /citizen/* (dashboard, my-land, search, mutation-apply,
  revenue, certificates, surveys, complaints, notifications, profile),
  /admin/* (dashboard, land-records, mutations, jamabandi, revenue, surveys,
  certificates, complaints, users, masters, reports, audit-logs)
- Navy (#0B2447 / slate-900) + white + teal accent. Sidebar + topbar +
  notifications + profile menu. Recharts for all charts, Leaflet/OpenStreetMap
  for a land-location map (demo coordinates around Patna, Bihar).
- Every page: loading, empty, success and error states. Toasts. Confirm dialogs
  for approve/reject/delete. Pagination + sorting + filters on every table.
- API layer: src/services/api.ts (single axios/fetch client, token + refresh
  interceptor). NO business logic in components beyond presentation.
- Demo mode: if VITE_API_URL is unset or the API is unreachable, the frontend
  falls back to src/services/demoData.ts (labelled "Demo data — API offline")
  so every button still works for a preview. Production build must NOT claim
  demo data is live data.
- Demo accounts (seeded backend + frontend demo data, same credentials):
  admin@lrms.demo / Demo@123 (SuperAdmin), officer@lrms.demo / Demo@123
  (CircleOfficer), citizen@lrms.demo / Demo@123 (Citizen).

## Backend (Node.js — user correction 2026-11-04, supersedes any ASP.NET mention)
- Node.js + Express + TypeScript, Prisma ORM + PostgreSQL.
- Swagger/OpenAPI docs at /api-docs (swagger-ui-express + swagger-jsdoc or a
  static openapi.yaml served there).
- Env (never committed): DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET,
  RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, PORT, CORS_ORIGIN.
- Seed: 3 districts (Patna, Gaya, Muzaffarpur), circles, mauzas, villages,
  ~24 land records, ~18 mutations across statuses, revenue rates + payments,
  surveys, LPC applications, complaints, disputes, notifications.
- PDF: PDFKit; Excel: ExcelJS. Receipts and
  certificates carry a unique reference number (LRMS-YYYY-XXXXXX).
- Tests: at least a smoke test project or endpoint test for auth + stats.

## Verification (each builder must report honestly)
- Frontend: `npm install && npm run build` must pass; report output.
- Backend: `npm install && npx prisma generate && npm run build` must pass
  (Node 24 is already installed in the VM, so this is verifiable here).
  A live Postgres is NOT available in the VM, so report DB-migration/seed
  verification as not run live if you cannot reach a Postgres instance —
  do NOT claim it ran. Code must still be complete, with prisma/schema.prisma
  and a seed script ready.
- Do NOT push to GitHub. Do NOT commit secrets. Leave the working tree ready
  for the user to approve a push.
