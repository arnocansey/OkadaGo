"use client";

import dynamic from "next/dynamic";

export type { MapMarker } from "@/components/passenger/map/interactive-map";

export const RideMap = dynamic(
  () => import("@/components/passenger/map/interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="pax-map-root rdr-map-root flex items-center justify-center bg-[#1a1a1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#FFC107] border-t-transparent" />
      </div>
    )
  }
);
