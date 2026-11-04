# Land Revenue Management System (LRMS)

An independent demo project inspired by Bihar land administration concepts
(land records, mutation / Dakhil-Kharij, Jamabandi, revenue collection, surveys,
LPC certificates, complaints and disputes).

**This is NOT an official Bihar Government system.** All data in the seed is
fictional demo data. Do not use it with real citizen records.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Leaflet/OpenStreetMap
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Auth:** JWT access tokens (60 min) + rotating refresh tokens, bcrypt passwords
- **Roles:** SuperAdmin, DistrictOfficer, CircleOfficer, RevenueEmployee, Amin, Citizen
- **Reports:** PDFKit (PDF) + ExcelJS (Excel)
- **Payments:** Razorpay **test mode only** — a payment is never marked Paid
  without a verified webhook signature

## Layout

```
frontend/   Admin portal + Citizen portal (role-gated routes)
backend/    Express API, Prisma schema + seed, Swagger at /api-docs
docs/       ARCHITECTURE.md (API contract), DEMO_ACCOUNTS.md
docker-compose.yml   Postgres + API (web behind profile `with-web`)
```

## Run locally

```bash
# Backend (needs Postgres — easiest via docker compose)
docker compose up -d postgres
cd backend
cp .env.example .env   # edit DATABASE_URL + JWT secrets; never commit .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run build && npm start   # http://localhost:5000, docs http://localhost:5000/api-docs

# Frontend (in another terminal)
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Without `VITE_API_URL` (or when the API is unreachable) the frontend runs on
clearly labelled demo data — "Demo data — API offline". Set `VITE_API_URL` to
the backend base URL for live data.

## Demo accounts (seeded)

- admin@lrms.demo / Demo@123 — SuperAdmin
- officer@lrms.demo / Demo@123 — CircleOfficer
- citizen@lrms.demo / Demo@123 — Citizen

See `docs/DEMO_ACCOUNTS.md` for the full list.

## Verified state (2026-11-04)

- Frontend production build passes (`tsc -b && vite build`)
- Backend `tsc` build passes, 3/3 smoke tests pass, boot smoke test verified
  (`/health`, `/api-docs`, unauthenticated dashboard → 401, unsigned webhook → 401)
- **Not yet verified live:** Postgres migration + seed round-trip, end-to-end
  API flow against a live database, and real Razorpay keys (test-mode stub only).
  Run the steps above where Postgres is available before treating this as
  production-ready.
- `docker-compose.yml` uses a placeholder dev database password — change it
  before any real deployment.
