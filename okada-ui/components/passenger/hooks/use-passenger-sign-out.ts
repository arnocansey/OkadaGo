"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

export function usePassengerSignOut() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  return async () => {
    await signOut();
    queryClient.clear();
    window.location.href = "/login";
  };
}
