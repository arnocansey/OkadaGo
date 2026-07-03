"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, LayoutDashboard, LogOut, TrendingUp, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRiderSignOut } from "@/components/rider/hooks/use-rider-sign-out";
import { initials } from "@/components/rider/types";

const links = [
  { href: "/rider", label: "Drive", icon: LayoutDashboard, exact: true },
  { href: "/rider/earnings", label: "Earnings", icon: TrendingUp },
  { href: "/rider/trips", label: "Trips", icon: Clock },
  { href: "/rider/profile", label: "Profile", icon: User }
];

export function RiderSidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const riderSignOut = useRiderSignOut();

  return (
    <aside className="rdr-sidebar" aria-label="Rider navigation">
      <div className="rdr-sidebar-brand">
        <div className="rdr-sidebar-mark">OG</div>
        <div>
          <strong>OkadaGo</strong>
          <span>Rider</span>
        </div>
      </div>

      <nav className="rdr-sidebar-nav">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rdr-sidebar-link${active ? " rdr-sidebar-link--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {session ? (
        <div className="rdr-sidebar-footer">
          <div className="rdr-sidebar-user">
            <div className="rdr-sidebar-avatar">{initials(session.user.fullName)}</div>
            <div>
              <div className="rdr-sidebar-user-name">{session.user.fullName}</div>
              <div className="rdr-sidebar-user-phone">{session.user.phoneE164}</div>
            </div>
          </div>
          <button type="button" className="rdr-sidebar-logout" onClick={() => void riderSignOut()}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      ) : null}
    </aside>
  );
}
