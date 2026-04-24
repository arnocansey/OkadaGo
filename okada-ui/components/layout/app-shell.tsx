"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

function isImmersivePath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  if (pathname === "/ui" || pathname.startsWith("/ui/")) {
    return false;
  }

  return (
    pathname === "/" ||
    pathname === "/safety-standards" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/passenger" ||
    pathname.startsWith("/passenger/") ||
    pathname === "/rider" ||
    pathname.startsWith("/rider/")
  );
}

export function AppShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const immersive = isImmersivePath(pathname);

  if (immersive) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
