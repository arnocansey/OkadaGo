# OkadaGo UI

Next.js App Router PWA shell for the OkadaGo motorcycle ride-hailing platform.

## What is included
- Marketing overview route: `/`
- Passenger route: `/passenger`
- Rider route: `/rider`
- Admin route: `/admin`
- Leaflet-based web map shell
- TanStack Query wiring
- TanStack Table wiring
- Service worker registration and manifest

## Run locally

```bash
pnpm install
pnpm dev
```

In local development, the web app now defaults API requests to `http://localhost:4000/v1` when `NEXT_PUBLIC_API_BASE_URL` is not set.

## Verify

```bash
pnpm typecheck
pnpm build
```

## Notes
- Set `NEXT_PUBLIC_API_BASE_URL` to override the backend URL in any environment.
- Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to enable the Mapbox-first basemap path, with OpenStreetMap as the fallback.
- The nested `okada-ui/okada-ui` folder contains the original visual reference mockups and is not part of the running app.
- The current scaffold avoids seeded operational records on purpose. Connect real APIs or fixtures later through TanStack Query and route handlers.
