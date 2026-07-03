"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, LogOut, User, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePassengerSignOut } from "@/components/passenger/hooks/use-passenger-sign-out";
import { initials } from "@/components/passenger/types";

const links = [
  { href: "/passenger", label: "Home", icon: Home, exact: true },
  { href: "/passenger/trips", label: "Trips", icon: Clock },
  { href: "/passenger/wallet", label: "Wallet", icon: Wallet },
  { href: "/passenger/profile", label: "Profile", icon: User }
];

export function PassengerSidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const passengerSignOut = usePassengerSignOut();

  return (
    <aside className="pax-sidebar" aria-label="Passenger navigation">
      <div className="pax-sidebar-brand">
        <div className="pax-sidebar-mark">OG</div>
        <div>
          <strong>OkadaGo</strong>
          <span>Passenger</span>
        </div>
      </div>

      <nav className="pax-sidebar-nav">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`pax-sidebar-link${active ? " pax-sidebar-link--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {session ? (
        <div className="pax-sidebar-footer">
          <div className="pax-sidebar-user">
            <div className="pax-sidebar-avatar">{initials(session.user.fullName)}</div>
            <div>
              <div className="pax-sidebar-user-name">{session.user.fullName}</div>
              <div className="pax-sidebar-user-phone">{session.user.phoneE164}</div>
            </div>
          </div>
          <button
            type="button"
            className="pax-sidebar-logout"
            onClick={() => void passengerSignOut()}
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      ) : null}
    </aside>
  );
}
