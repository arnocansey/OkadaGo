"use client";

import { useEffect, useState } from "react";
import { resolveAddressLabel } from "@/lib/location";

export function useLocationLabel(lat: number, lng: number, enabled = true) {
  const [label, setLabel] = useState("Accra, GH");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);

    void resolveAddressLabel(lat, lng).then((resolved) => {
      if (cancelled) return;
      setLabel(resolved);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, enabled]);

  return { label, loading };
}
