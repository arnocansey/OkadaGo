import Link from "next/link";
import { adminAppPath } from "@/lib/admin-app";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/passenger", label: "Passenger" },
  { href: "/rider", label: "Rider" },
  { href: adminAppPath("/"), label: "Admin", external: true }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          <div className="brand-mark">OG</div>
          <div className="brand-copy">
            <strong>OkadaGo</strong>
            <span>Ride-hailing platform foundation</span>
          </div>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {navItems.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="button-row">
          <a href={adminAppPath("/")} className="button-ghost">
            Operations
          </a>
          <Link href="/passenger" className="button">
            Launch PWA
          </Link>
        </div>
      </div>
    </header>
  );
}
