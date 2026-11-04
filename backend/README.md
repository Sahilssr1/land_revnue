# LRMS Backend — Node.js + Express + TypeScript + Prisma + PostgreSQL

**Independent demo/educational project inspired by Bihar land administration
concepts. This is NOT an official Bihar Government system and must never be
presented as one. All seed data is fictional.**

## Stack
- Node.js 24 + Express 4 + TypeScript, Prisma ORM + PostgreSQL
- JWT access tokens (60 min) + rotating refresh tokens (SHA-256 hashed at rest)
- bcryptjs password hashing, role-based authorization
- Swagger UI at `/api-docs` (spec also at `/api-docs.json`)
- PDF via PDFKit, Excel via ExcelJS
- Rate limiting (global 300 req/min/IP; auth endpoints 30 req/min/IP)

## Roles (exact strings)
`SuperAdmin | DistrictOfficer | CircleOfficer | RevenueEmployee | Amin | Citizen`

## Run locally
```bash
cd backend
cp .env.example .env   # then edit DATABASE_URL + JWT secrets (never commit .env)
npm install
npx prisma generate
npx prisma migrate dev --name init   # creates tables in Postgres
npm run seed                          # fictional demo data
npm run build
npm start
```
- API: http://localhost:5000 — Swagger: http://localhost:5000/api-docs — Health: http://localhost:5000/health
- Or from repo root: `docker compose up postgres api` (api waits for nothing —
  ensure Postgres is healthy first; see docker-compose.yml).

> Env vars (see `.env.example`, never commit real values): `DATABASE_URL`,
> `JWT_SECRET`, `JWT_REFRESH_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
> `RAZORPAY_WEBHOOK_SECRET`, `PORT`, `CORS_ORIGIN`.

## API surface (see `../docs/ARCHITECTURE.md` for the full contract)
- `POST /api/auth/register` (Citizen), `POST /api/auth/verify-otp` (**mock**:
  any 6-digit code verifies — demo only, never production),
  `POST /api/auth/login|refresh|logout`, `GET /api/auth/me`
- `GET /api/dashboard/admin-stats`, `citizen-stats`, `revenue-monthly`,
  `mutation-stats`, `district-records`, `approval-trends` — all computed
  from the database, never hardcoded.
- CRUD: `/api/land-records` (+ `/search`), `/api/jamabandi`,
  `/api/mutations` (+ `/approve|reject|request-documents|assign`, document upload),
  `/api/revenue` (+ `/rates`, `/payments`, `/payments/{id}/receipt`),
  `/api/surveys` (+ `/assign`, `/report`), `/api/certificates`
  (+ `/applications/{id}/issue`, `/{id}/download`),
  `/api/complaints` (+ `/disputes`), `/api/admin/users` (+ `/activate|deactivate`),
  `/api/admin/masters/*`, `/api/reports/{district|revenue|mutation|ownership|survey|employee}?format=pdf|xlsx`,
  `/api/notifications`, `/api/audit-logs`
- All list endpoints accept `?search=&district=&circle=&status=&page=&pageSize=&sort=`
  and return `{ items, total, page, pageSize }`.
- Errors are `{ error: { code, message } }` with proper HTTP status codes.

## Key guarantees
- **Mutation approve is atomic**: one Prisma `$transaction` updates the
  LandRecord owner, creates the new Jamabandi record (old one marked
  historical), appends LandOwnershipHistory, sets the mutation Approved, and
  writes the AuditLog — all commit or all roll back.
- **Payments are never marked Paid without a verified Razorpay webhook
  signature** (`POST /api/webhooks/razorpay` verifies HMAC-SHA256 of the raw
  body against `RAZORPAY_WEBHOOK_SECRET`). Razorpay runs in **test mode only**;
  the frontend must show a "Test mode — no real money" banner.
- **Citizen scoping is server-side**: citizens only see their own land
  records, applications, payments, surveys, certificates and complaints
  (filtered by their JWT user id, never by a client-supplied id).
  `/api/land-records/search` returns limited fields only (no owner contact details).
- **Uploads**: PDF/JPG/PNG only, max 5 MB, validated server-side.
- **Audit logging**: every admin action writes an AuditLog row.

## Demo accounts
See `../docs/DEMO_ACCOUNTS.md` (demo credentials live only there and in
seed bootstrap code; passwords are bcrypt-hashed at seed time, never stored
in plaintext).

## Prisma engine note (sandbox workaround, harmless elsewhere)
`npx prisma generate` downloads engine binaries with Node's fetch, which
this sandbox's egress proxy resets (`ECONNRESET` / socket hang-up), while
`curl` reaches `binaries.prisma.sh` fine. If you hit that, download the
binaries with curl into `backend/.prisma-bin/` (gitignored) and generate
with explicit paths:
```bash
# commit hash from: node -e "console.log(require('./node_modules/@prisma/engines-version/package.json').prisma.enginesVersion)"
curl -sL -o .prisma-bin/schema-engine.gz "https://binaries.prisma.sh/all_commits/<COMMIT>/debian-openssl-3.0.x/schema-engine.gz"
curl -sL -o .prisma-bin/libquery_engine.so.node.gz "https://binaries.prisma.sh/all_commits/<COMMIT>/debian-openssl-3.0.x/libquery_engine.so.node.gz"
gunzip .prisma-bin/*.gz
PRISMA_SCHEMA_ENGINE_BINARY=$PWD/.prisma-bin/schema-engine \
PRISMA_QUERY_ENGINE_LIBRARY=$PWD/.prisma-bin/libquery_engine.so.node npx prisma generate
cp .prisma-bin/libquery_engine.so.node node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node
```
The Dockerfile does the same steps automatically.

## Tests
```bash
npm test   # contract smoke tests (no database required)
```
Live endpoint tests (auth + stats against a real DB) still need Postgres and
are therefore **not yet run** — see "Unverified" below.

## Unverified / not yet live-tested
- Live PostgreSQL round-trip: `prisma migrate dev` and `npm run seed` were
  **not run** — no Postgres is reachable from this VM. `prisma/schema.prisma`
  and `prisma/seed.ts` are ready to run where Postgres exists; do not claim
  otherwise.
- Real Razorpay keys/webhook delivery (test-mode verification stub only; no
  keys configured).
- End-to-end mutation-approve transaction against live Postgres
  (transaction-wrapped in code, not yet executed against a database).
