/** Standalone admin Vercel app (see frontend/admin-app). */
export function getAdminAppUrl() {
  return (process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.okadago.com").replace(/\/$/, "");
}

export function adminAppPath(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getAdminAppUrl()}${normalized === "/" ? "/" : normalized}`;
}
