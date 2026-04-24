export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand">
            <div className="brand-mark">OG</div>
            <div className="brand-copy">
              <strong>OkadaGo</strong>
              <span>Built for Ghana first and ready for multi-city scale.</span>
            </div>
          </div>
          <p className="note" style={{ marginTop: 16 }}>
            This repository now contains the product blueprint, relational schema, API contract outline,
            and a PWA-ready Next.js UI shell using TanStack Query/Table and Leaflet.
          </p>
        </div>

        <div>
          <h4>Product</h4>
          <ul>
            <li>Passenger booking</li>
            <li>Rider operations</li>
            <li>Admin control tower</li>
          </ul>
        </div>

        <div>
          <h4>Architecture</h4>
          <ul>
            <li>Next.js App Router PWA</li>
            <li>PostgreSQL + Prisma schema</li>
            <li>Realtime dispatch backbone</li>
          </ul>
        </div>

        <div>
          <h4>Focus</h4>
          <ul>
            <li>Low-bandwidth resilience</li>
            <li>Swap-ready payments and SMS</li>
            <li>Safety-first trip design</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
