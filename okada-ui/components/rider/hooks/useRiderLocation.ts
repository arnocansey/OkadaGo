"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchJson, postJson } from "@/lib/api";
import type { RiderRecord } from "../rider-portal-types";

export function useRiderLocation({
  riderProfileId,
  rider,
  activeRide,
  userId,
  isDeficitLocked
}: {
  riderProfileId: string | undefined;
  rider: RiderRecord | null;
  activeRide: { id: string } | null;
  userId: string | undefined;
  isDeficitLocked: boolean;
}) {
  const queryClient = useQueryClient();
  const [availabilityOverride, setAvailabilityOverride] = useState<boolean | null>(null);

  const isOnline = availabilityOverride ?? rider?.onlineStatus ?? false;
  const displayIsOnline = !isDeficitLocked && isOnline;

  useEffect(() => {
    if (!riderProfileId) {
      return;
    }

    if (!(displayIsOnline || activeRide) || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        void patchJson(`/riders/${riderProfileId}/availability`, {
          onlineStatus: displayIsOnline,
          latitude,
          longitude
        });

        if (activeRide) {
          void postJson(`/rides/${activeRide.id}/location`, {
            riderProfileId,
            source: "rider_web",
            latitude,
            longitude,
            speedKph:
              position.coords.speed != null && position.coords.speed >= 0
                ? position.coords.speed * 3.6
                : undefined,
            heading:
              position.coords.heading != null && position.coords.heading >= 0
                ? position.coords.heading
                : undefined,
            accuracyM: position.coords.accuracy
          });
        }
      },
      () => {
        // Live rider tracking should fail softly if browser location is unavailable.
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 10_000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeRide, displayIsOnline, riderProfileId]);

  const updateAvailability = useMutation({
    mutationFn: async (onlineStatus: boolean) =>
      patchJson(`/riders/${riderProfileId}/availability`, {
        onlineStatus
      }),
    onMutate: async (onlineStatus) => {
      setAvailabilityOverride(onlineStatus);
      await queryClient.cancelQueries({ queryKey: ["riders"] });

      const previousRiders = queryClient.getQueryData<RiderRecord[]>(["riders"]);
      queryClient.setQueryData<RiderRecord[]>(["riders"], (current = []) =>
        current.map((entry) =>
          entry.id === riderProfileId ? { ...entry, onlineStatus } : entry
        )
      );

      return { previousRiders };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRiders) {
        queryClient.setQueryData(["riders"], context.previousRiders);
      }
      setAvailabilityOverride(null);
    },
    onSettled: async () => {
      setAvailabilityOverride(null);
      await queryClient.invalidateQueries({ queryKey: ["riders"] });
    }
  });

  const advanceRideStatus = useMutation({
    mutationFn: async (nextStatus: string) => {
      if (!activeRide || !userId) {
        throw new Error("No active ride is available.");
      }

      return patchJson(`/rides/${activeRide.id}/status`, {
        nextStatus,
        actorRole: "rider",
        actorUserId: userId
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      await queryClient.invalidateQueries({ queryKey: ["wallets", userId] });
    }
  });

  return { displayIsOnline, updateAvailability, advanceRideStatus };
}
