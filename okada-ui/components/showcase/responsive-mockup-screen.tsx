"use client";

import { useEffect, useState } from "react";
import { MockupExactScreen } from "@/components/showcase/mockup-showcase";
import type { FlowArea } from "@/components/showcase/flow-config";

const desktopFlowMap: Partial<Record<FlowArea, Record<string, string[]>>> = {
  passenger: {
    home: ["web", "passenger-home"],
    "ride-confirmation": ["web", "passenger-ride-confirmation"],
    "searching-rider": ["web", "passenger-searching-rider"],
    "rider-assigned": ["web", "passenger-rider-assigned"],
    "live-tracking": ["web", "passenger-live-tracking"],
    payment: ["web", "passenger-payment"],
    rating: ["web", "passenger-rating"],
    "ride-history": ["web", "passenger-ride-history"],
    wallet: ["web", "passenger-wallet"],
    profile: ["web", "passenger-profile"],
    safety: ["web", "passenger-safety"]
  },
  rider: {
    "document-upload": ["web", "rider-document-upload"],
    "home-offline": ["web", "rider-home-offline"],
    "home-online": ["web", "rider-home-online"],
    "incoming-trip": ["web", "rider-incoming-trip"],
    navigation: ["web", "rider-navigation"],
    "active-trip": ["web", "rider-active-trip"],
    "earnings-dashboard": ["web", "rider-earnings-dashboard"],
    wallet: ["web", "rider-wallet"],
    ratings: ["web", "rider-ratings"],
    profile: ["web", "rider-profile"]
  },
  admin: {
    overview: ["web", "admin-overview"],
    riders: ["web", "admin-riders"],
    passengers: ["web", "admin-passengers"],
    payments: ["web", "admin-payments"],
    "live-map": ["web", "admin-live-map"],
    promotions: ["web", "admin-promotions"],
    notifications: ["web", "admin-notifications"],
    safety: ["web", "admin-safety"],
    settings: ["web", "admin-settings"]
  }
};

export function resolveResponsiveFlowSlug(
  area: FlowArea,
  screen: string,
  isDesktop: boolean
): string[] {
  if (!isDesktop) {
    return [area, screen];
  }

  const desktopSlug = desktopFlowMap[area]?.[screen];
  if (desktopSlug) {
    return desktopSlug;
  }

  return [area, screen];
}

export function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [breakpoint]);

  return isDesktop;
}

export function ResponsiveFlowScreen({
  area,
  screen
}: {
  area: FlowArea;
  screen: string;
}) {
  const isDesktop = useIsDesktop();
  const slug = resolveResponsiveFlowSlug(area, screen, isDesktop);

  return <MockupExactScreen slug={slug} />;
}
