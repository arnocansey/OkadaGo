import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Admin console lives on a separate Vercel app; this proxy no longer gates /admin. */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: []
};
