import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "okada-ui",
    checkedAt: new Date().toISOString()
  });
}
