import { NextResponse } from "next/server";
import { resolveCeidSession } from "@/lib/auth-server";
import { isLiveCasConfigured } from "@/lib/cas";

export async function GET(request: Request) {
  const session = await resolveCeidSession(request);
  return NextResponse.json(
    {
      ...session,
      casLive: isLiveCasConfigured(),
    },
    { headers: { "cache-control": "private, no-store" } }
  );
}
