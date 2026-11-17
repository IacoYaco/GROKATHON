import { NextResponse } from "next/server";
import { resolveCeidSession } from "@/lib/auth-server";

export async function GET(request: Request) {
  const session = await resolveCeidSession(request);
  return NextResponse.json(session, {
    headers: { "cache-control": "private, no-store" },
  });
}
