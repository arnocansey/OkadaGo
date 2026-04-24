# OkadaGo Platform Blueprint

## 1. Product overview

### Vision
OkadaGo is a motorcycle ride-hailing platform for high-density African cities where speed, trust, affordability, and operational resilience matter more than generic global ride-share assumptions. The product is designed for Ghana and Nigeria first, with the ability to expand into additional cities, currencies, payment rails, and service lines.

### Core outcomes
- Give passengers a fast and reliable way to move through traffic-heavy cities.
- Give riders a compliant, high-trust, earnings-optimized operating platform.
- Give admins a live command center for supply, pricing, safety, payments, and growth.
- Give support and dispatch teams the tooling to intervene quickly during live trips and incidents.

### Product principles
- Mobile-first before desktop-first.
- Safety and verification are product features, not back-office afterthoughts.
- Realtime is used where it improves trust or dispatch speed, not for visual noise.
- All external providers are abstracted by country-aware adapters.
- The platform must remain usable under weak-network conditions.

### Platform surfaces
- Passenger app: ride discovery, booking, tracking, payment, rating, support.
- Rider app: onboarding, verification, trip execution, earnings, payouts, support.
- Admin dashboard: live oversight, approvals, pricing, finance, incidents, analytics.
- Optional dispatcher console: manual booking, reassignment, and emergency handling.

## 2. Core user roles

### Passenger
- Register with phone and/or email.
- Verify account via OTP.
- Create, schedule, cancel, and track rides.
- Manage wallet, payment methods, promo codes, referral code, saved places, emergency contacts.
- Rate riders and report incidents.

### Rider
- Register and submit identity plus vehicle documents.
- Wait for approval before going online.
- Accept, reject, and execute rides.
- View earnings, incentives, payouts, ratings, and system announcements.
- Trigger emergency workflows and contact support.

### Admin
- Manage all users, compliance, zones, pricing, promotions, wallets, incidents, and CMS.
- Approve or reject riders.
- Review disputes, payouts, and withdrawals.
- View analytics, audit logs, and live trip supervision.

### Dispatcher / support agent
- Book trips on behalf of passengers.
- Reassign or cancel live rides.
- Handle support tickets, complaints, incidents, and emergency escalations.

### Permission model
- `passenger`: self-service access to personal booking, wallet, and support resources only.
- `rider`: access to rider onboarding, ride fulfillment, earnings, and payout resources only.
- `dispatcher`: can read and modify trips, tickets, and incidents but cannot change platform finance rules.
- `admin`: full write access with audited actions, scoped by internal permission groups if needed.

## 3. Full feature list

### Authentication and account security
- Phone signup, email signup, and hybrid login.
- OTP verification for phone onboarding and high-risk actions.
- Refresh token rotation and device/session management.
- Password reset and secure credential recovery.
- Role-based access control.
- Rate limiting for auth, OTP, wallet, and payout endpoints.
- Suspicious-login detection, device fingerprinting, and audit trail.

### Passenger features
- Home/work/favorites.
- Place search, reverse geocoding, and pin-drop selection.
- Fare estimate before ride request.
- Instant ride request and scheduled rides.
- Realtime rider matching and trip timeline.
- In-app chat/call handoff.
- Trip sharing and trusted contacts.
- Wallet top-up, card, cash, and mobile money support.
- Promo and referral application.
- Ride history, receipts, and issue reporting.

### Rider features
- Rider onboarding flow with KYC and motorcycle documents.
- Verification progress and rejection remediation.
- Online/offline shift mode.
- Incoming request screen with acceptance timeout.
- Pickup navigation, arrival confirmation, trip start/end control.
- Earnings by trip/day/week/month.
- Bonus and incentive visibility.
- Withdrawal request flow and payout setup.
- Rider support and announcements.

### Admin and operations features
- Live trip supervision and ride search.
- Rider application review with document preview.
- Service zone management and operating hours.
- Dynamic pricing rule setup.
- Wallet and payout review.
- Incident, dispute, and support ticket handling.
- Referral and promo campaign management.
- Passenger and rider suspension/ban controls.
- CSV/PDF export architecture.
- CMS pages, notifications, and announcements.

### Safety features
- SOS trigger on active trip.
- Trusted contact trip sharing.
- Incident classification and severity workflow.
- Helmet reminder, rider badge, and compliance status.
- Full ride event logging.
- Support escalation playbooks for lost items, crash, harassment, and fraud.

## 4. App modules

### Passenger app modules
- Auth and verification
- Booking and location search
- Fare estimation
- Matching and active trip tracking
- Wallet and payments
- History, receipts, ratings
- Support and safety center
- Notifications and account settings

### Rider app modules
- Auth and profile setup
- KYC and vehicle document capture
- Availability and dispatch queue
- Live trip navigation
- Earnings and wallet
- Payout setup and withdrawal requests
- Ratings and support
- Profile, bike, and compliance management

### Admin dashboard modules
- Authentication and operator management
- Overview and analytics dashboard
- Riders and documents
- Passengers and support
- Trips and live map
- Pricing and service zones
- Finance, wallets, commissions, payouts
- Promo, referral, and campaign management
- Incidents, disputes, and audit logs
- CMS, notification center, and settings

## 5. Database schema

### Design notes
- PostgreSQL is the source of truth.
- Prisma is used as the ORM schema layer.
- Soft deletes are applied to mutable business entities that may need recovery or audit review.
- Ledger-like objects such as wallet transactions are immutable.
- Money is stored as `Decimal` plus `currency`.
- Geodata uses decimal latitude/longitude with optional GeoJSON in `Json` fields for zones.

### Core tables
- `users`
- `user_sessions`
- `user_devices`
- `passenger_profiles`
- `rider_profiles`
- `admin_profiles`
- `dispatcher_profiles`
- `vehicles`
- `rider_documents`
- `rides`
- `ride_locations`
- `ride_events`
- `payments`
- `wallets`
- `wallet_transactions`
- `payout_requests`
- `ratings`
- `reviews`
- `promo_codes`
- `promo_redemptions`
- `referrals`
- `notifications`
- `support_tickets`
- `support_ticket_messages`
- `incidents`
- `emergency_contacts`
- `saved_places`
- `pricing_rules`
- `service_zones`
- `audit_logs`

### Relationship summary
- One user can have one passenger, rider, admin, or dispatcher profile depending on role.
- A rider has one active vehicle record and many rider documents.
- A passenger creates many rides; a rider completes many rides.
- A ride has one payment and many ride events/locations.
- A user can have multiple wallets by type/currency.
- Wallet transactions may reference rides, payments, or payouts.
- Promo redemptions connect promos to users and rides.
- Referrals connect a referrer user to a referred user.
- Incidents and support tickets can reference a ride.

### Indexing strategy
- Unique indexes on phone E.164, email, referral codes, rider display code, promo code.
- Composite indexes on ride status plus service zone plus requested time.
- Composite indexes on rider availability plus current coordinates fields for nearby matching.
- Composite indexes on payout status plus requested time.
- Composite indexes on document status plus expiry date.
- Composite indexes on incident severity plus status plus created time.

### Status enums
- Account status: active, suspended, banned, pending verification.
- Rider approval: pending, approved, rejected, suspended.
- Ride lifecycle: searching, assigned, arriving, arrived, started, completed, cancelled.
- Payment status: pending, authorized, captured, failed, refunded, cancelled.
- Wallet transaction status: pending, posted, reversed, failed.
- Payout status: requested, reviewing, approved, processing, paid, rejected, cancelled.
- Ticket status: open, pending passenger, pending rider, escalated, resolved, closed.
- Incident severity: low, medium, high, critical.

## 6. API architecture

### Style
- REST for core CRUD and business actions.
- WebSockets for rider location updates, ride status updates, dispatch offers, chat, and live admin supervision.
- Background workers for notifications, OTP, matching retries, payout processing, referral rewards, and document expiry reminders.

### Module groups
- `/auth`
- `/users`
- `/passengers`
- `/riders`
- `/rides`
- `/matching`
- `/payments`
- `/wallets`
- `/payouts`
- `/promotions`
- `/referrals`
- `/support`
- `/incidents`
- `/notifications`
- `/admin`
- `/dispatch`
- `/analytics`

### Request/response discipline
- Input validation via schema validators.
- ISO datetime fields everywhere.
- Currency-aware money objects.
- Paginated list responses with cursor or page metadata.
- Consistent error object with `code`, `message`, `details`, and `traceId`.

### Realtime channels
- `ride.requested`
- `ride.offer.created`
- `ride.offer.accepted`
- `ride.offer.expired`
- `ride.status.changed`
- `ride.location.updated`
- `wallet.updated`
- `incident.created`
- `admin.broadcast`

## 7. Mobile app screen architecture

### Passenger screens
- Splash
- Onboarding
- Login
- OTP verification
- Profile completion
- Home map
- Pickup and destination search
- Fare quote
- Booking confirmation
- Searching for rider
- Rider assigned
- Active trip tracking
- Payment selection
- Rating and review
- Ride history
- Receipt detail
- Wallet
- Saved places
- Notifications
- Safety center
- Help and support

### Rider screens
- Onboarding
- Login
- Profile setup
- Document upload
- Verification pending
- Home online status
- Incoming request modal
- Pickup navigation
- Active trip
- Earnings dashboard
- Wallet and payout
- Ratings and reviews
- Ride history
- Profile and bike settings
- Support and announcements

### UX requirements
- Large touch targets.
- Minimal field friction for phone-based usage.
- Strong empty, error, and reconnect states.
- Aggressive hierarchy for primary trip actions.
- Passenger and rider safety affordances always visible during active rides.

## 8. Admin dashboard architecture

### Dashboard sections
- Executive overview
- Live operations map
- Rider applications
- Passengers
- Trips
- Pricing and zones
- Wallets and payouts
- Promotions and referrals
- Incidents and disputes
- Support tickets
- Analytics and exports
- Settings and CMS

### Core admin workflows
- Approve rider documents.
- Suspend a rider or passenger.
- Reassign a trip.
- Trigger refund or wallet credit.
- Review and approve a rider payout.
- Investigate incident or support case.
- Adjust pricing rule or service zone configuration.

### Design direction
- Enterprise control tower tone.
- Dense data presentation without clutter.
- Fast search and table workflows.
- Map-centric monitoring for live operations.

## 9. UX/UI design system

### Visual direction
- Premium African mobility startup aesthetic.
- Deep green trust palette with orange action accent.
- Editorial display typography mixed with clean operational body text.
- Strong cards, rounded edges, subtle glass surfaces in dark contexts.

### Color system
- Primary: `#1b6d3e`
- Primary dark: `#124b2a`
- Accent: `#ff7a19`
- Background dark: `#061610`
- Surface dark: `#0d241a`
- Surface light: `#edf5ef`
- Text light: `#f4f8f4`
- Text dark: `#102118`

### Component architecture
- App shell
- Sticky header and role switch navigation
- Metric tiles
- Empty state cards
- Form controls
- Status chips
- Table wrapper
- Leaflet map shell
- Page sidebar with anchor sections

### Accessibility
- Sufficient color contrast.
- Semantic sections and landmarks.
- Large buttons and readable copy spacing.
- Keyboard reachable admin interface.

## 10. Matching and fare engine logic

### Matching flow
1. Passenger submits a ride request with pickup, destination, ride type, and payment method.
2. The ride is scored against the active service zone and pricing rules.
3. Matching service fetches nearby approved riders who are online, not on active trips, and within an acceptable pickup radius.
4. Candidate riders are ranked by distance-to-pickup, predicted pickup ETA, rider acceptance reliability, recent cancellation rate, service zone fit, and optional rating threshold.
5. The top candidate receives an offer with a response timer.
6. If no response or rejection occurs, the system offers the trip to the next-ranked rider, widening radius if needed.
7. If no rider accepts within the defined threshold, the request transitions to a failed match state and passenger is informed.

### Matching inputs
- Rider online status
- Rider approval state
- Vehicle status
- Pickup distance
- Current rider workload
- Zone eligibility
- Scheduled ride timing window
- Risk flags or temporary suspensions

### Ride lifecycle
- Searching
- Rider assigned
- Rider arriving
- Rider arrived
- Trip started
- Trip completed
- Cancelled

### Fare engine
`totalFare = max(minFare, baseFare + distanceFee + durationFee + waitingFee + surgeFee + zoneFee - promoDiscount - referralDiscount + platformFees + tax)`

### Fare rules
- Base fare per ride type and city.
- Per-kilometer and per-minute rates.
- Waiting fee after a grace period.
- Cancellation fee when the rider or passenger cancels after configurable milestones.
- Surge multiplier by zone, time band, weather/event flag, or supply-demand ratio.
- Promo and referral discounts applied after eligibility checks.

### Commission logic
- Gross fare is split into rider earnings and platform commission.
- Platform commission can vary by city, service type, or campaign.
- Cash trips create rider cash-collection and settlement obligations where applicable.
- Wallet or card trips settle commission automatically.

## 11. Security architecture

### Core controls
- JWT access token with rotating refresh token.
- Hashed passwords with strong memory-hard algorithm.
- OTP attempt throttling and expiry.
- Request validation and serialization guards.
- API rate limiting per IP, device, and user.
- RBAC on every route.
- Audit logging for sensitive admin actions.
- Encrypted storage for payment references and personally sensitive fields.

### Operational safeguards
- Device/session visibility.
- Payout hold logic for suspicious accounts.
- Velocity checks for referral abuse and promo fraud.
- Incident and dispute workflows with actor attribution.
- File upload validation, virus scanning, content-type enforcement, and secure object storage.

## 12. Deployment plan

### Recommended topology
- `okada-ui`: Next.js PWA deployed on Vercel.
- Backend API: NestJS or modular Node API deployed on Railway, Render, Fly.io, or AWS.
- PostgreSQL: managed Postgres with daily backups and point-in-time recovery.
- Redis: cache, queue, rate limiting, and socket presence.
- Object storage: S3-compatible storage or Cloudinary for documents and profile media.
- Background workers: separate worker process for matching retries, notifications, and payouts.

### Environments
- Local
- Staging
- Production

### DevOps essentials
- Separate environment variables per environment.
- Migration pipeline for Prisma schema.
- Structured logging and alerting.
- Error tracking for frontend and backend.
- Uptime monitoring for APIs, workers, and socket services.

## 13. MVP roadmap

### MVP scope
- Passenger auth and booking
- Rider auth and document onboarding
- Admin rider approval
- Realtime ride request and rider acceptance
- Ride tracking and completion
- Cash plus one digital payment rail
- Basic wallet ledger
- Ratings and trip history
- Basic safety reporting

### Phase 2
- Promo codes and referrals
- Scheduled rides
- In-app chat
- Better analytics and exports
- Dispute management
- Wallet top-up and richer payout automation

### Phase 3
- Corporate accounts
- Subscription packages for riders
- Delivery and parcel mode
- AI demand forecasting and adaptive surge
- Multi-city operational automation
- Dispatcher center

## 14. Future scaling roadmap

### Expansion ideas
- Parcel and courier delivery.
- Food and commerce dispatch.
- Intercity bike transport.
- White-label city operations for franchises.
- Corporate mobility accounts with spend controls.
- Insurance add-ons for riders and passengers.

### Platform engineering roadmap
- Geo-indexed matching and route cost optimization.
- Driver risk scoring and safety anomaly detection.
- Country-specific tax and compliance modules.
- Real offline queueing and background sync for PWA trip draft recovery.
- Fine-grained permissions and internal admin teams.

## Recommended folder structure

```text
OkadaGo/
  backend/
    openapi/
    prisma/
    src/
      common/
      modules/
  docs/
    okadago-platform-blueprint.md
  okada-ui/
    app/
    components/
    lib/
    public/
```

## Tech stack recommendation
- Frontend PWA: Next.js App Router, React 19, TanStack Query, TanStack Table, Leaflet.
- Backend: NestJS or modular Fastify-based Node service.
- ORM: Prisma.
- Database: PostgreSQL.
- Queue/cache/realtime support: Redis.
- Maps: Mapbox or Google Maps for production routing, Leaflet for current web UI.
- Mobile money abstraction: provider adapters per country.
- Push: Firebase Cloud Messaging.
- SMS/OTP: Termii, Hubtel, or Africa's Talking behind a provider abstraction.

## Smart product decisions applied
- PWA-first web shell for lightweight rollout while native apps can follow.
- Empty operational states instead of fabricated rides, drivers, or payouts.
- Country adapter pattern for SMS and payments instead of hard-coding a single provider.
- Strong compliance and incident architecture from the start to protect marketplace trust.
