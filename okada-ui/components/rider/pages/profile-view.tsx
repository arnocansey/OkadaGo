"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bike, Camera, ChevronRight, LogOut, Shield, User } from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { RiderAppFrame } from "@/components/rider/layout/app-frame";
import { useRiderData } from "@/components/rider/hooks/use-rider-data";
import { useRiderSignOut } from "@/components/rider/hooks/use-rider-sign-out";
import { rdrToast } from "@/components/rider/lib/toast";
import { ProfileSkeleton } from "@/components/rider/ui/skeletons";
import { initials, type RiderSettings } from "@/components/rider/types";

function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rdr-list-section">
      <h3 className="rdr-list-section-title">{title}</h3>
      {children}
    </div>
  );
}

function ListItem({
  icon: Icon,
  title,
  href,
  onClick,
  danger
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const className = `rdr-list-item${danger ? " rdr-list-item--danger" : ""}`;
  const content = (
    <>
      <Icon size={22} />
      <span className="flex-1">{title}</span>
      {!danger ? <ChevronRight size={20} className="rdr-text-muted" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function ProfileView() {
  const { session, setSession } = useAuth();
  const data = useRiderData();
  const riderSignOut = useRiderSignOut();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", city: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["rider-settings", session?.token],
    queryFn: () => requestJson<RiderSettings>("/auth/rider/settings", { token: session?.token }),
    enabled: Boolean(session?.token)
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm({
        fullName: settingsQuery.data.fullName,
        email: settingsQuery.data.email ?? "",
        city: settingsQuery.data.city ?? ""
      });
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      requestJson<{
        token: string;
        expiresAt: string;
        user: NonNullable<typeof session>["user"];
      }>("/auth/rider/settings", {
        method: "PATCH",
        token: session?.token,
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          city: form.city.trim() || null
        })
      }),
    onSuccess: (payload) => {
      if (session) {
        setSession({ token: payload.token, expiresAt: payload.expiresAt, user: payload.user });
      }
      setEditing(false);
      rdrToast.success("Profile updated");
    },
    onError: (error) => {
      rdrToast.error("Could not save profile", (error as Error).message);
    }
  });

  const avatarMutation = useMutation({
    mutationFn: (base64: string) =>
      requestJson<{
        token: string;
        expiresAt: string;
        user: NonNullable<typeof session>["user"];
      }>("/auth/avatar", {
        method: "POST",
        token: session?.token,
        body: JSON.stringify({ imageBase64: base64 })
      }),
    onSuccess: (payload) => {
      if (session) {
        setSession({ token: payload.token, expiresAt: payload.expiresAt, user: payload.user });
      }
      rdrToast.success("Photo updated");
    },
    onError: (error) => {
      rdrToast.error("Could not upload photo", (error as Error).message);
    },
    onSettled: () => setUploadingAvatar(false)
  });

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      avatarMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const vehicle = data.rider?.vehicle;
  const approvalStatus = session?.user.riderApprovalStatus ?? "pending";

  return (
    <RiderAppFrame>
      <div className="rdr-page">
        <div className="rdr-page-header">
          <h1>Profile</h1>
        </div>
        <div className="rdr-page-content">
          <h1 className="rdr-page-title">Profile</h1>

          {settingsQuery.isLoading ? (
            <ProfileSkeleton />
          ) : (
            <>
              <div className="rdr-profile-hero">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {session?.user.avatarUrl ? (
                      <img
                        src={session.user.avatarUrl}
                        alt={session.user.fullName}
                        className="rdr-avatar-xl object-cover"
                      />
                    ) : (
                      <div className="rdr-avatar-xl">{initials(session?.user.fullName ?? "R")}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--rdr-primary)] text-white border-2 border-[var(--rdr-background)] hover:opacity-90 disabled:opacity-50"
                    >
                      <Camera size={14} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold leading-tight">{session?.user.fullName}</h2>
                    <p className="text-sm rdr-text-secondary">{session?.user.phoneE164}</p>
                    <div className="mt-2 inline-flex rounded-md bg-[var(--rdr-surface-elevated)] px-2 py-0.5 text-xs font-medium">
                      {approvalStatus.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
              </div>

              {vehicle ? (
                <div className="rdr-card mb-6 p-4">
                  <div className="flex items-center gap-3">
                    <Bike size={22} className="rdr-text-secondary" />
                    <div>
                      <div className="font-semibold">
                        {vehicle.make} {vehicle.model}
                        {vehicle.year ? ` (${vehicle.year})` : ""}
                      </div>
                      <div className="text-sm rdr-text-secondary">{vehicle.plateNumber}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rdr-wallet-card mb-6">
                <div className="rdr-wallet-card-label">Available balance</div>
                <div className="text-3xl font-bold">
                  {data.settlementWallet
                    ? formatMoney(data.settlementWallet.currency, data.settlementWallet.availableBalance)
                    : "—"}
                </div>
              </div>

              {editing ? (
                <div className="rdr-card mb-6 p-4">
                  <h3 className="mb-4 font-bold">Edit profile</h3>
                  <div className="mb-3">
                    <label className="rdr-field-label">Full name</label>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      className="rdr-input"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="rdr-field-label">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="rdr-input"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="rdr-field-label">City</label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="rdr-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing(false)} className="rdr-btn-secondary flex-1">
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={saveMutation.isPending}
                      onClick={() => saveMutation.mutate()}
                      className="rdr-btn-primary flex-1 !h-11"
                    >
                      {saveMutation.isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : null}

              <ListSection title="Account">
                <ListItem icon={User} title="Edit profile" onClick={() => setEditing(true)} />
                <ListItem icon={Shield} title="Earnings & payouts" href="/rider/earnings" />
              </ListSection>

              <ListSection title="App">
                <ListItem icon={LogOut} title="Log out" danger onClick={() => void riderSignOut()} />
              </ListSection>
            </>
          )}
        </div>
      </div>
    </RiderAppFrame>
  );
}
