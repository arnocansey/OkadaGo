# OkadaGo

OkadaGo is a motorcycle ride-hailing ("Okada") + food/groceries delivery platform for African markets. This repo is a multi-project monorepo (no root workspace); each app has its own `package.json` and pnpm lockfile.

| Path | Project | Stack |
|------|---------|-------|
| `backend/` | REST API (`/v1`) + Socket.IO realtime | Fastify 5 + Prisma 7 + PostgreSQL |
| `okada-ui/` | Web app: marketing + `/passenger` `/rider` `/admin` (PWA) | Next.js 16 + React 19 + Tailwind 4 |
| `frontend/passenger-app/` | Passenger mobile app | Expo SDK 54 / React Native |
| `frontend/rider-app/` | Rider mobile app | Expo SDK 54 / React Native |
| `okada-ui/okada-ui/` | Vite mockup sandbox — visual reference only, NOT part of the running app | Vite + React |

All projects use **pnpm** and **Node 22+**.

## Cursor Cloud specific instructions

The startup update script runs `pnpm install` in `backend/`, `okada-ui/`, `frontend/passenger-app/`, `frontend/rider-app/` and generates the Prisma client. PostgreSQL, the DB schema, and `.env` files are NOT created by it — see below.

### Services & how to run (dev)
- **PostgreSQL (required)** — not started automatically. Start it and ensure the `okadago` DB + `postgres`/`postgres` password exist:
  - `sudo pg_ctlcluster 16 main start`
  - `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"`
  - `sudo -u postgres psql -c "CREATE DATABASE okadago;"` (ignore error if it already exists)
- **Backend (required)** — `cd backend && pnpm dev` (tsx watch, port **4000**). Needs `backend/.env`. Copy `backend/.env.example` and set at minimum `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/okadago`. After the DB is up, sync the schema with `pnpm prisma:push` (there is no migration history; the project uses `prisma db push`). Health check: `GET http://localhost:4000/v1/health`.
- **Web (required for web E2E)** — `cd okada-ui && pnpm dev` (Next.js, port **3000**). In dev it defaults the API to `http://localhost:4000/v1` if `NEXT_PUBLIC_API_BASE_URL` is unset, so no `.env` is strictly needed. Backend `CORS_ORIGIN` defaults to `http://localhost:3000`.
- **Mobile apps (optional locally)** — Expo Metro; cannot be meaningfully run in a headless VM. They default `EXPO_PUBLIC_API_BASE_URL` to a remote Render URL; for local use point it at the host LAN IP `http://<host-ip>:4000/v1` (not `localhost`).

### First admin / auth
- There are no seed records. Create the first admin via `cd backend && pnpm admin:bootstrap`, which requires the `FIRST_ADMIN_*` vars in `backend/.env` (`FIRST_ADMIN_PASSWORD` must be ≥8 chars). It fails if an admin already exists.
- Admin dashboard login is at web route `/admin/login`; the API endpoint is `POST /v1/auth/admin/login`.
- OTP SMS is not required in dev: `POST /v1/auth/otp/request` returns a `debugCode` when no SMS provider is configured.

### Verification (no linter or test runner exists in any project)
- There is **no ESLint config and no test suite** anywhere. "Verification" = TypeScript typecheck + build.
- Typecheck: `pnpm typecheck` in `backend/`, `okada-ui/`, `frontend/passenger-app/`, `frontend/rider-app/`.
- Build: `backend/` → `pnpm build`; `okada-ui/` → `pnpm build`.

### Gotchas
- `backend/README.md` describes an aspirational stack (NestJS, Redis). The real backend is **Fastify** and does **not** use Redis.
- The Prisma client is generated into `backend/src/generated/prisma` (committed). Re-run `pnpm prisma:generate` after schema changes.
- Optional external integrations (Paystack, SMTP, Google Places, Mapbox, SMS) are unset by default and degrade gracefully; food/groceries `/bootstrap/places/*` returns `PLACES_NOT_CONFIGURED` without `GOOGLE_PLACES_API_KEY`.
