# LRMS Frontend — Land Revenue Management System (Demo)

**Independent demo/educational project inspired by Bihar land administration concepts. NOT an official Bihar Government system. No real citizen data — all seed data is fictional.**

## Stack
Vite + React 18 + TypeScript + Tailwind CSS + Recharts + Leaflet/OpenStreetMap + lucide-react. Hand-rolled shadcn-style primitives under `src/components/ui.tsx` (no paid CLI dependency).

## Run
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

## API
Single client: `src/services/api.ts` (JWT + refresh-token interceptor, endpoints per `../docs/ARCHITECTURE.md`). Set `VITE_API_URL` to the backend base URL (e.g. `http://localhost:5000`). If unset or unreachable, the app falls back to `src/services/demoData.ts` and shows the banner **"Demo data — API offline"** — demo data is never presented as live data.

## Demo accounts
- admin@lrms.demo / Demo@123 (SuperAdmin)
- officer@lrms.demo / Demo@123 (CircleOfficer)
- citizen@lrms.demo / Demo@123 (Citizen)

OTP on registration is MOCKED in demo (any 6-digit code verifies) — never use in production. Payments show a Razorpay TEST MODE banner and are never marked Paid without verified gateway confirmation (in demo mode, no real payment is attempted).
