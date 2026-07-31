"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requestJson } from "@/lib/api";
import { useAdminToast } from "./AdminToast";

export type AdminNoteEntityType = "RIDER" | "INCIDENT" | "PAYOUT" | "PASSENGER" | "TICKET";

export type AdminNoteRecord = {
  id: string;
  entityType: AdminNoteEntityType;
  entityId: string;
  body: string;
  createdAt: string;
  author: { id: string; fullName: string; email: string | null };
};

/** Ops notes pinned to a rider, incident, payout, passenger, or ticket. */
export function useAdminNotes(
  token: string | null | undefined,
  entityType: AdminNoteEntityType,
  entityId: string | null | undefined
) {
  const queryClient = useQueryClient();
  const { addToast } = useAdminToast();
  const queryKey = ["admin-notes", token, entityType, entityId];

  const { data, isPending } = useQuery<AdminNoteRecord[]>({
    queryKey,
    queryFn: () =>
      requestJson(
        `/admin/notes?entityType=${entityType}&entityId=${encodeURIComponent(entityId ?? "")}`,
        { token }
      ),
    enabled: Boolean(token && entityId),
    staleTime: 15000
  });

  const addNoteMutation = useMutation({
    mutationFn: (body: string) =>
      requestJson("/admin/notes", {
        method: "POST",
        token,
        body: JSON.stringify({ entityType, entityId, body })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      addToast("Note added", "success");
    },
    onError: (error) => addToast((error as Error).message || "Could not add note", "error")
  });

  return {
    notes: data ?? [],
    notesLoading: isPending,
    addNote: (body: string) => addNoteMutation.mutate(body),
    addingNote: addNoteMutation.isPending
  };
}
