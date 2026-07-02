"use client";

import { PassengerAuthGate } from "@/components/passenger/layout/auth-gate";
import { PassengerBottomNav } from "@/components/passenger/ui/bottom-nav";
import { PassengerSidebar } from "@/components/passenger/ui/sidebar-nav";

type AppFrameProps = {
  children: React.ReactNode;
  hideNav?: boolean;
  fullBleed?: boolean;
};

export function PassengerAppFrame({ children, hideNav = false, fullBleed = false }: AppFrameProps) {
  return (
    <PassengerAuthGate>
      <div className="pax-app">
        <div className="pax-shell">
          {!hideNav ? <PassengerSidebar /> : null}
          <div className={`pax-main${!hideNav && !fullBleed ? " pax-main--with-nav" : ""}`}>{children}</div>
        </div>
        {!hideNav ? <PassengerBottomNav /> : null}
      </div>
    </PassengerAuthGate>
  );
}
