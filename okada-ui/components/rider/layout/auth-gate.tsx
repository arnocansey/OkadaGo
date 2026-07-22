"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { RdrSkeleton } from "@/components/rider/ui/skeletons";

export function RiderAuthGate({ children }: { children: React.ReactNode }) {
  const { status, session } = useAuth();

  if (status === "loading") {
    return (
      <div className="rdr-app flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4" aria-busy aria-label="Loading">
          <RdrSkeleton className="mx-auto h-14 w-14 rounded-full" />
          <RdrSkeleton className="mx-auto h-5 w-40" />
          <RdrSkeleton className="mx-auto h-4 w-56" />
          <div className="flex gap-3 pt-2">
            <RdrSkeleton className="h-11 flex-1 rounded-xl" />
            <RdrSkeleton className="h-11 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user.role !== "rider") {
    return (
      <div className="rdr-app rdr-auth-wall">
        <div className="rdr-auth-mark">OG</div>
        <h1>Drive with OkadaGo</h1>
        <p>Go online, accept trips, and earn on your schedule across Ghana.</p>
        <div className="rdr-auth-actions">
          <Link href="/rider/signup" className="rdr-auth-signup">
            Create rider account
          </Link>
          <Link href="/rider/login" className="rdr-auth-login">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!session.user.riderProfileId) {
    return (
      <div className="rdr-app rdr-auth-wall">
        <div className="rdr-auth-mark">OG</div>
        <h1>Rider profile pending</h1>
        <p>Your account is signed in but rider onboarding is not complete yet.</p>
        <div className="rdr-auth-actions">
          <Link href="/rider/login" className="rdr-auth-login">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
