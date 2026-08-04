# OkadaGo Backend Architecture

## Recommended stack
- Runtime: Node.js 22+
- Framework: NestJS with modular domain boundaries
- ORM: Prisma
- Database: PostgreSQL
- Cache / queue / presence: Redis
- Transport: REST + WebSockets
- Validation: Zod or class-validator at module boundaries

## Suggested module layout

```text
backend/
  openapi/
    openapi.yaml
  prisma/
    schema.prisma
  src/
    common/
      auth/
      decorators/
      filters/
      guards/
      interceptors/
      pipes/
    modules/
      admin/
      analytics/
      auth/
      dispatch/
      incidents/
      notifications/
      passengers/
      payments/
      pricing/
      promotions/
      referrals/
      riders/
      rides/
      support/
      wallets/
```

## Core backend responsibilities
- User identity and role access control
- Rider verification workflow
- Ride request creation and lifecycle updates
- Matching engine orchestration
- Fare calculation and pricing policy application
- Payment orchestration and wallet ledgering
- Payout workflow
- Support and incident escalation
- Analytics aggregation and admin exports

## Background jobs
- OTP delivery and expiry cleanup
- Matching retries and widening search radius
- Notification fanout
- Document expiry reminders
- Scheduled ride dispatch
- Payout processing
- Referral reward settlement

## Realtime event flow
1. Passenger creates ride request.
2. Ride request is persisted with `searching` state.
3. Matching service finds eligible riders and emits offer events.
4. Rider app receives offer and returns accept or reject action.
5. Ride state changes are broadcast to passenger, rider, and admin channels.
6. Rider location pings are stored and streamed to active subscribers.
7. Trip completion triggers fare finalization, payment capture, wallet postings, and rating prompts.

## Database setup
- `npm run prisma:push` syncs `prisma/schema.prisma` to `DATABASE_URL` (this project uses `db push`, not `migrate`).
- `npm run db:postgis` (optional but recommended for production) runs `prisma/postgis-setup.sql`, which enables the `postgis` extension, adds the `RiderProfile.currentLocation` geography column, and creates a GiST index for fast nearest-rider queries. Supported on Render, Railway (custom image), Supabase, and RDS with the PostGIS add-on.
- If PostGIS is not enabled, the backend detects this at boot and automatically falls back to the existing in-memory Haversine matching — no functionality is lost, only the query performance advantage at scale.

## Business rules to enforce server-side
- Rider must be approved and online before receiving offers.
- Trip can only start after rider arrival or pickup confirmation.
- Cancellation fee depends on timing and party responsible.
- Promo code usage must check campaign scope, validity, city, and user limits.
- Payouts cannot exceed available rider settlement balance.
- Incident severity can automatically escalate support routing and admin notification.
