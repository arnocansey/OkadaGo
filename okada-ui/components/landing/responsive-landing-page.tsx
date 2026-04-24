"use client";

import { LandingPage as DesktopLandingPage } from "@/okada-ui/screens/okada-landing/LandingPage";
import { ExactLandingPage } from "@/components/landing/exact-landing-page";
import { useIsDesktop } from "@/components/showcase/responsive-mockup-screen";

export function ResponsiveLandingPage() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DesktopLandingPage />;
  }

  return <ExactLandingPage />;
}
