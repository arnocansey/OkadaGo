"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { PaxSkeleton } from "@/components/passenger/ui/skeletons";

export function PassengerAuthGate({ children }: { children: React.ReactNode }) {
  const { status, session } = useAuth();

  if (status === "loading") {
    return (
      <div className="pax-app flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4" aria-busy aria-label="Loading">
          <PaxSkeleton className="mx-auto h-14 w-14 rounded-full" />
          <PaxSkeleton className="mx-auto h-5 w-40" />
          <PaxSkeleton className="mx-auto h-4 w-56" />
          <div className="flex gap-3 pt-2">
            <PaxSkeleton className="h-11 flex-1 rounded-xl" />
            <PaxSkeleton className="h-11 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user.role !== "passenger") {
    return (
      <div className="pax-auth-wall">
        <div className="pax-auth-mark">OG</div>
        <h1>Ride with OkadaGo</h1>
        <p>Fast, safe motorcycle rides across Ghana. Sign in to book your next trip.</p>
        <div className="pax-auth-actions">
          <Link href="/signup" className="pax-auth-signup">
            Create account
          </Link>
          <Link href="/login" className="pax-auth-login">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
