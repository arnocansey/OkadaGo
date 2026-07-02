"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, User, Wallet } from "lucide-react";

const tabs = [
  { href: "/passenger", label: "Home", icon: Home, exact: true },
  { href: "/passenger/trips", label: "Trips", icon: Clock },
  { href: "/passenger/wallet", label: "Wallet", icon: Wallet },
  { href: "/passenger/profile", label: "Profile", icon: User }
];

export function PassengerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pax-nav-bar" aria-label="Passenger navigation">
      {tabs.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`pax-nav-item${active ? " pax-nav-item--active" : ""}`}
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
