"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Camera,
  ChevronRight,
  CreditCard,
  History,
  LogOut,
  MapPin,
  Shield,
  User
} from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { usePassengerSignOut } from "@/components/passenger/hooks/use-passenger-sign-out";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { paxToast } from "@/components/passenger/lib/toast";
import { ProfileSkeleton } from "@/components/passenger/ui/skeletons";
import { initials, type PassengerSettings, type Wallet } from "@/components/passenger/types";

type SettingsUpdateResponse = {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    role: "passenger";
    fullName: string;
    email: string | null;
    phoneE164: string;
    preferredCurrency: string;
    avatarUrl: string | null;
    passengerProfileId: string | null;
    riderProfileId: string | null;
    riderApprovalStatus: string | null;
    adminProfileId: string | null;
    dispatcherProfileId: string | null;
    accountStatus: string;
    phoneCountryCode: string;
    phoneLocal: string;
  };
  settings: PassengerSettings;
};

function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pax-list-section">
      <h3 className="pax-list-section-title">{title}</h3>
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
  const className = `pax-list-item${danger ? " pax-list-item--danger" : ""}`;
  const content = (
    <>
      <Icon size={22} />
      <span className="flex-1">{title}</span>
      {!danger ? <ChevronRight size={20} className="pax-text-muted" /> : null}
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
  const passengerSignOut = usePassengerSignOut();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", defaultServiceCity: "", preferredPayment: "cash" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const walletsQuery = useQuery({
    queryKey: ["wallets", session?.user.id],
    queryFn: () => requestJson<Wallet[]>(`/wallets/users/${session?.user.id}`),
    enabled: Boolean(session?.user.id)
  });

  const settingsQuery = useQuery({
    queryKey: ["passenger-settings", session?.token],
    queryFn: () =>
      requestJson<PassengerSettings>("/auth/passenger/settings", { token: session?.token }),
    enabled: Boolean(session?.token)
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm({
        fullName: settingsQuery.data.fullName,
        email: settingsQuery.data.email ?? "",
        defaultServiceCity: settingsQuery.data.defaultServiceCity ?? "",
        preferredPayment: settingsQuery.data.preferredPayment ?? "cash"
      });
    }
  }, [settingsQuery.data]);

  const preferredWallet =
    (walletsQuery.data ?? []).find((w) => w.currency === session?.user.preferredCurrency) ??
    walletsQuery.data?.[0] ??
    null;

  const saveMutation = useMutation({
    mutationFn: () =>
      requestJson<SettingsUpdateResponse>("/auth/passenger/settings", {
        method: "PATCH",
        token: session?.token,
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          defaultServiceCity: form.defaultServiceCity.trim() || null,
          preferredPayment: form.preferredPayment
        })
      }),
    onSuccess: (data) => {
      setSession({
        token: data.token,
        expiresAt: data.expiresAt,
        user: data.user
      });
      void queryClient.invalidateQueries({ queryKey: ["passenger-settings"] });
      setEditing(false);
      paxToast.success("Profile updated");
    },
    onError: (error) => {
      paxToast.error("Could not save profile", (error as Error).message);
    }
  });

  const avatarMutation = useMutation({
    mutationFn: (base64: string) =>
      requestJson<SettingsUpdateResponse>("/auth/avatar", {
        method: "POST",
        token: session?.token,
        body: JSON.stringify({ imageBase64: base64 })
      }),
    onSuccess: (data) => {
      setSession({ token: data.token, expiresAt: data.expiresAt, user: data.user });
      void queryClient.invalidateQueries({ queryKey: ["passenger-settings"] });
      paxToast.success("Photo updated");
    },
    onError: (error) => {
      paxToast.error("Could not upload photo", (error as Error).message);
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

  return (
    <PassengerAppFrame>
      <div className="pax-page">
        <div className="pax-page-header">
          <h1>Profile</h1>
        </div>

        <div className="pax-page-content">
          <h1 className="pax-page-title">Profile</h1>

          {settingsQuery.isLoading ? (
            <ProfileSkeleton />
          ) : (
            <>
          <div className="pax-profile-hero">
            <div className="flex items-center gap-4">
              <div className="relative">
                {session?.user.avatarUrl ? (
                  <img
                    src={session.user.avatarUrl}
                    alt={session.user.fullName}
                    className="pax-avatar-xl object-cover"
                  />
                ) : (
                  <div className="pax-avatar-xl">{initials(session?.user.fullName ?? "OG")}</div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pax-primary)] text-white border-2 border-[var(--pax-background)] hover:opacity-90 disabled:opacity-50"
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
                <p className="text-sm pax-text-secondary">{session?.user.phoneE164}</p>
                {settingsQuery.data?.referralCode ? (
                  <div className="mt-2 inline-flex rounded-md bg-[var(--pax-surface-elevated)] px-2 py-0.5 text-xs font-medium pax-text-primary">
                    Referral: {settingsQuery.data.referralCode}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pax-wallet-card mb-6">
            <div className="pax-wallet-card-label">Wallet balance</div>
            <div className="text-3xl font-bold">
              {formatMoney(
                preferredWallet?.currency ?? session?.user.preferredCurrency ?? "GHS",
                preferredWallet?.availableBalance ?? 0
              )}
            </div>
          </div>

          {editing ? (
            <div className="pax-card mb-6 p-4">
              <h3 className="mb-4 font-bold">Edit profile</h3>
              <div className="mb-3">
                <label className="pax-field-label">Full name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="pax-input"
                />
              </div>
              <div className="mb-3">
                <label className="pax-field-label">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="pax-input"
                />
              </div>
              <div className="mb-4">
                <label className="pax-field-label">Default city</label>
                <input
                  value={form.defaultServiceCity}
                  onChange={(e) => setForm((f) => ({ ...f, defaultServiceCity: e.target.value }))}
                  className="pax-input"
                />
              </div>
              {saveMutation.error ? (
                <p className="mb-2 text-sm pax-text-danger">{(saveMutation.error as Error).message}</p>
              ) : null}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(false)} className="pax-btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="pax-btn-primary flex-1 !h-11"
                >
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : null}

          <ListSection title="Account">
            <ListItem icon={User} title="Edit profile" onClick={() => setEditing(true)} />
            <ListItem icon={MapPin} title="Saved places" href="/passenger/places" />
            <ListItem icon={History} title="Ride history" href="/passenger/trips" />
            <ListItem icon={Bell} title="Notifications" href="/passenger/notifications" />
          </ListSection>

          <ListSection title="Payments">
            <ListItem icon={CreditCard} title="Payment methods" href="/passenger/payments" />
            <ListItem icon={History} title="Transaction history" href="/passenger/wallet" />
          </ListSection>

          <ListSection title="Safety">
            <ListItem icon={Shield} title="Safety settings" href="/passenger/safety" />
          </ListSection>

          <ListSection title="App">
            <ListItem icon={LogOut} title="Log out" danger onClick={() => void passengerSignOut()} />
          </ListSection>
            </>
          )}
        </div>
      </div>
    </PassengerAppFrame>
  );
}
