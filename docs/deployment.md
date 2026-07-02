# OkadaGo Deployment

OkadaGo is split into two production services:

- `okada-ui`: Next.js web app
- `backend`: Fastify API + Prisma + PostgreSQL

Recommended production shape:

- Web: Vercel
- API: Render, Railway, Fly.io, or any Docker-capable Node host
- Database: managed PostgreSQL (Neon, Supabase, Railway Postgres, Render Postgres)

## 1. Deploy the web app

Project root:

```bash
OkadaGo/okada-ui
```

Build/start:

```bash
pnpm install
pnpm build
pnpm start
```

Required environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/v1
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_MAPBOX_STYLE_ID=mapbox/streets-v12
NEXT_PUBLIC_MAPBOX_USE_CUSTOM_STYLE=false
```

If you deploy on Vercel:

- Import `okada-ui` as its own project root
- Framework preset: `Next.js`
- Package manager: `pnpm`
- Set the env vars above in the Vercel project settings

## 2. Deploy the backend API

Project root:

```bash
OkadaGo/backend
```

Production scripts:

```bash
npm install
npm run build
npm run start:prod
```

Required environment variables:

```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://your-web-domain.com
JWT_ISSUER=okadago
JWT_AUDIENCE=okadago-clients
API_PUBLIC_URL=https://your-api-domain.com
APP_WEB_URL=https://your-web-domain.com
PAYSTACK_SECRET_KEY=
PAYSTACK_BASE_URL=https://api.paystack.co
MAPBOX_ACCESS_TOKEN=
# Required for Food & groceries (/bootstrap/places/*). Server-side key — not the mobile Maps SDK keys.
GOOGLE_PLACES_API_KEY=
GEOCODING_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_USER_AGENT=OkadaGo/0.1 (https://your-web-domain.com)
GEOCODING_CONTACT_EMAIL=
```

### Google Places (Food & groceries)

The passenger app loads nearby restaurants via backend proxy endpoints (`/bootstrap/places/*`). You must configure the **backend**, not the Expo app:

1. In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Enable APIs**:
   - **Places API (New)** — required
   - **Places API** (legacy) — optional fallback
2. Ensure **billing** is linked to the project.
3. Create an API key for the server:
   - **Application restrictions**: None (Render/server has no fixed referrer)
   - **API restrictions**: Restrict key → select **Places API (New)** and **Places API**
4. On Render (or your API host), set `GOOGLE_PLACES_API_KEY=<server-key>` and **redeploy**.
5. Verify:

```bash
curl "https://your-api-domain.com/v1/bootstrap/places/nearby?lat=5.6037&lng=-0.1870"
```

A successful response includes `"results": [...]`. Errors return JSON with `code`, `message`, and `details.suggestion`.

Optional bootstrap env vars for the first admin:

```env
FIRST_ADMIN_FULL_NAME=
FIRST_ADMIN_EMAIL=
FIRST_ADMIN_PHONE_COUNTRY_CODE=+233
FIRST_ADMIN_PHONE_LOCAL=
FIRST_ADMIN_PHONE_E164=
FIRST_ADMIN_PASSWORD=
FIRST_ADMIN_PREFERRED_CURRENCY=GHS
FIRST_ADMIN_TITLE=
FIRST_ADMIN_PERMISSIONS=users:manage:any,analytics:read:any
```

## 3. Push the database schema

This backend currently uses Prisma `db push` rather than a migration history.

Run this once after the API has access to the production `DATABASE_URL`:

```bash
npm run prisma:push
```

## 4. Create the first admin

After the database is live, run:

```bash
npm run admin:bootstrap
```

Then sign in at:

```text
/admin/login
```

## 5. Verify the live system

Check:

- landing page loads
- `/login` and `/signup` point home correctly
- `/safety-standards` loads publicly
- passenger, rider, and admin pages load
- backend health/API requests succeed
- CORS accepts the deployed web domain
- maps load when a Mapbox public token is configured

## 6. Recommended live setup

Use this pairing unless you already have another host:

- `okada-ui` -> Vercel
- `backend` -> Render or Railway
- `database` -> Neon Postgres

That keeps the Next.js app on the platform it fits best, while the API stays as a normal long-running Node service.
