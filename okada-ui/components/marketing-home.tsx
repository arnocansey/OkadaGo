import Link from "next/link";
import { adminModules, launchCities, passengerModules, riderModules } from "@/lib/contracts";
import { PlatformHealthCard } from "@/components/dashboard/platform-health-card";

export function MarketingHome() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="panel hero-copy">
            <div className="eyebrow">African motorcycle mobility, built for real operations</div>
            <h1>Launch OkadaGo as a modern passenger, rider, and admin platform.</h1>
            <p>
              This repository now combines a production-minded product blueprint, a PWA-ready web
              surface, a full relational schema, and an API contract plan tailored to the realities
              of motorcycle transport in Ghana, with room to scale regionally when the product is ready.
            </p>

            <div className="hero-metrics">
              <div className="stat-card">
                <strong>Passenger flow</strong>
                <span>Booking, trip tracking, payments, safety, and receipts</span>
              </div>
              <div className="stat-card">
                <strong>Rider flow</strong>
                <span>Verification, dispatch, earnings, and payout operations</span>
              </div>
              <div className="stat-card">
                <strong>Admin flow</strong>
                <span>Pricing, live oversight, incidents, analytics, and compliance</span>
              </div>
            </div>

            <div className="button-row" style={{ marginTop: 28 }}>
              <Link href="/passenger" className="button">
                Open passenger workspace
              </Link>
              <Link href="/admin" className="button-secondary">
                Review operations console
              </Link>
            </div>
          </div>

          <div className="hero-stack">
            <div className="panel booking-card">
              <p className="kicker">Experience direction</p>
              <h3>Mobile-first PWA entry point</h3>
              <div className="booking-grid">
                <div className="field-group">
                  <label className="field-label">Pickup</label>
                  <input className="input" placeholder="Current location or saved place" />
                </div>
                <div className="field-group">
                  <label className="field-label">Destination</label>
                  <input className="input" placeholder="Market, office, airport, or home" />
                </div>
                <div className="field-group">
                  <label className="field-label">Execution notes</label>
                  <textarea
                    className="textarea"
                    placeholder="Cash, wallet, or mobile money. Accessibility notes, helmet reminder, or preferred gate."
                  />
                </div>
              </div>
              <p className="note" style={{ marginTop: 14 }}>
                This shell intentionally avoids fake bookings or riders. The focus is real structure,
                empty states, and integration-readiness.
              </p>
            </div>

            <PlatformHealthCard />
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="kicker">Launch Markets</p>
              <h2>Ghana-first launch setup</h2>
            </div>
            <p>
              The architecture assumes Ghana-first service-zone pricing, mobile money support,
              intermittent connectivity resilience, and phone-first trust-building, while staying ready for regional expansion.
            </p>
          </div>

          <div className="four-up">
            {launchCities.map((city) => (
              <article key={city.name} className="info-card">
                <p className="kicker">
                  {city.country} · {city.currency}
                </p>
                <h3>{city.name}</h3>
                <p>{city.focus}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="kicker">Module map</p>
              <h2>Three operational surfaces, one shared product core</h2>
            </div>
            <p>
              The UI is split into focused route surfaces so each actor sees a clean experience while
              sharing the same identity, pricing, wallet, support, and realtime foundations.
            </p>
          </div>

          <div className="three-up">
            <article className="info-card">
              <h3>Passenger app</h3>
              <ul className="module-list">
                {passengerModules.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="info-card">
              <h3>Rider app</h3>
              <ul className="module-list">
                {riderModules.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="info-card">
              <h3>Admin console</h3>
              <ul className="module-list">
                {adminModules.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title">
            <div>
              <p className="kicker">Repository output</p>
              <h2>What is now in the codebase</h2>
            </div>
            <p>
              The app shell is supported by backend and product artifacts so development can move
              from architecture into implementation without rewriting the core platform decisions.
            </p>
          </div>

          <div className="two-up">
            <article className="info-card dark">
              <h3>Frontend foundation</h3>
              <ul className="check-list">
                <li>Next.js App Router PWA structure in `okada-ui`</li>
                <li>TanStack Query for client data orchestration</li>
                <li>TanStack Table for operational list rendering</li>
                <li>Leaflet-based web map surface for live operations</li>
                <li>Passenger, rider, and admin route surfaces with empty states</li>
              </ul>
            </article>

            <article className="info-card dark">
              <h3>Delivery artifacts</h3>
              <ul className="check-list">
                <li>Detailed product blueprint in `docs/okadago-platform-blueprint.md`</li>
                <li>Production-minded Prisma schema in `backend/prisma/schema.prisma`</li>
                <li>OpenAPI structure in `backend/openapi/openapi.yaml`</li>
                <li>Backend module plan in `backend/README.md`</li>
                <li>Legacy visual references retained in `okada-ui/okada-ui`</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
