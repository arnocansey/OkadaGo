# OkadaGo Admin — Vercel deploy checklist
#
# 1. Create a new Vercel project
# 2. Root Directory: frontend/admin-app
# 3. Framework Preset: Next.js
# 4. Environment variables:
#      NEXT_PUBLIC_API_BASE_URL=https://okadago-backend.onrender.com/v1
#      NEXT_PUBLIC_ADMIN_APP_URL=https://admin.okadago.com
#      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...   (optional, Integrations/maps)
#      NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...  (optional, payment settings UI)
# 5. Attach custom domain: admin.okadago.com
# 6. Backend CORS_ORIGIN must include https://admin.okadago.com
#    (and http://localhost:3001 for local admin-app)
# 7. If Google Maps keys use HTTP-referrer restrictions, add admin.okadago.com
# 8. Public okada-ui redirects /admin/* → this host (see okada-ui next.config.ts)
#
# Local:
#   cd frontend/admin-app
#   cp .env.example .env.local
#   npm install
#   npm run dev   # http://localhost:3001
