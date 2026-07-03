"use client";

import { RiderAuthGate } from "@/components/rider/layout/auth-gate";
import { RiderBottomNav } from "@/components/rider/ui/bottom-nav";
import { RiderSidebar } from "@/components/rider/ui/sidebar-nav";

type AppFrameProps = {
  children: React.ReactNode;
  hideNav?: boolean;
  fullBleed?: boolean;
};

export function RiderAppFrame({ children, hideNav = false, fullBleed = false }: AppFrameProps) {
  return (
    <RiderAuthGate>
      <div className="rdr-app">
        <div className="rdr-shell">
          {!hideNav ? <RiderSidebar /> : null}
          <div className={`rdr-main${!hideNav && !fullBleed ? " rdr-main--with-nav" : ""}`}>{children}</div>
        </div>
        {!hideNav ? <RiderBottomNav /> : null}
      </div>
    </RiderAuthGate>
  );
}
