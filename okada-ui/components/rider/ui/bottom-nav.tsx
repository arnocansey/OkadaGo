"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, LayoutDashboard, TrendingUp, User } from "lucide-react";

const tabs = [
  { href: "/rider", label: "Drive", icon: LayoutDashboard, exact: true },
  { href: "/rider/earnings", label: "Earnings", icon: TrendingUp },
  { href: "/rider/trips", label: "Trips", icon: Clock },
  { href: "/rider/profile", label: "Profile", icon: User }
];

export function RiderBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="rdr-nav-bar" aria-label="Rider navigation">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rdr-nav-item${active ? " rdr-nav-item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
