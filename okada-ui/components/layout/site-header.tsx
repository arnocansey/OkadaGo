import Link from "next/link";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/passenger", label: "Passenger" },
  { href: "/rider", label: "Rider" },
  { href: "/admin", label: "Admin" }
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
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="button-row">
          <Link href="/admin" className="button-ghost">
            Operations
          </Link>
          <Link href="/passenger" className="button">
            Launch PWA
          </Link>
        </div>
      </div>
    </header>
  );
}
