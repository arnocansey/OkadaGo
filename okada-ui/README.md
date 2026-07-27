# OkadaGo UI

Next.js App Router PWA shell for the OkadaGo motorcycle ride-hailing platform.

## What is included
- Marketing overview route: `/`
- Passenger route: `/passenger`
- Rider route: `/rider`
- Admin console: separate app at `frontend/admin-app` (`NEXT_PUBLIC_ADMIN_APP_URL`, default `https://admin.okadago.com`). `/admin` on this site redirects there.
- Leaflet-based web map shell
- TanStack Query wiring
- TanStack Table wiring
- Service worker registration and manifest

## Run locally

```bash
pnpm install
pnpm dev
```

In local development, the web app defaults API requests to `http://localhost:4000/v1` when `NEXT_PUBLIC_API_BASE_URL` is not set.

Admin console (separate):

```bash
cd ../frontend/admin-app
npm install
npm run dev
```

## Verify

```bash
pnpm typecheck
pnpm build
```

## Notes
- Set `NEXT_PUBLIC_API_BASE_URL` to override the backend URL in any environment.
- Set `NEXT_PUBLIC_ADMIN_APP_URL` for the standalone admin site (local default `http://localhost:3001`).
- Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to enable the Mapbox-first basemap path, with OpenStreetMap as the fallback.
- The nested `okada-ui/okada-ui` folder contains the original visual reference mockups and is not part of the running app.
