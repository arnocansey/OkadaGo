"use client";

import { Bike, Bell, LogOut } from "lucide-react";
import { RiderOnlineToggle } from "./RiderOnlineToggle";
import type { RiderRecord, RiderPortalScreen } from "./rider-portal-types";

export function RiderShell({
  screen,
  displayIsOnline,
  isDeficitLocked,
  riderProfileId,
  updateAvailabilityPending,
  onToggleOnline,
  rider,
  session,
  signOut
}: {
  screen: RiderPortalScreen;
  displayIsOnline: boolean;
  isDeficitLocked: boolean;
  riderProfileId: string | undefined;
  updateAvailabilityPending: boolean;
  onToggleOnline: () => void;
  rider: RiderRecord | null;
  session: { user: { fullName: string }; token: string };
  signOut: () => Promise<void>;
}) {
  return (
    <header className="exact-rider-topnav">
      <div className="exact-rider-topnav-left">
        <div className="exact-logo-box">
          <Bike size={20} />
        </div>
        <span className="exact-rider-wordmark">OKADAGO</span>
        <span className="exact-rider-chip">Rider Portal</span>
        <nav className="exact-rider-navlinks">
          <a href="/rider" className={screen === "dashboard" ? "active" : undefined}>
            Dashboard
          </a>
          <a href="/rider/earnings" className={screen === "earnings" ? "active" : undefined}>
            Earnings
          </a>
          <a href="/rider/trips" className={screen === "trips" ? "active" : undefined}>
            Trips
          </a>
        </nav>
      </div>

      <div className="exact-rider-topnav-right">
        <RiderOnlineToggle
          displayIsOnline={displayIsOnline}
          isDeficitLocked={isDeficitLocked}
          isPending={updateAvailabilityPending}
          riderProfileId={riderProfileId}
          onToggle={onToggleOnline}
        />
        <button
          className="exact-icon-button"
          type="button"
          aria-label="Open rider notifications"
          title="Open rider notifications"
        >
          <Bell size={18} />
        </button>
        <button
          className="exact-icon-button"
          type="button"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => {
            void signOut().then(() => {
              window.location.href = "/rider/login";
            });
          }}
        >
          <LogOut size={16} />
        </button>
        <button className="exact-profile-button rider" type="button">
          <div className="exact-avatar">
            {session.user.fullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <strong>{session.user.fullName}</strong>
            <span>
              {rider?.vehicle
                ? `${rider.vehicle.make} ${rider.vehicle.model}`
                : "No vehicle on file"}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
