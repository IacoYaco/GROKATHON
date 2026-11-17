import { NextResponse } from "next/server";
import { resolveCeidSession } from "@/lib/auth-server";
import { TOUCHNET_STORE_ID, syncTouchNetInventory } from "@/lib/touchnet";

export async function GET(request: Request) {
  const session = await resolveCeidSession(request);
  if (!session.account) {
    return NextResponse.json({ error: "Yale ID required" }, { status: 401 });
  }

  const force =
    new URL(request.url).searchParams.get("refresh") === "1" ||
    new URL(request.url).searchParams.get("refresh") === "true";

  const payload = await syncTouchNetInventory(force);
  return NextResponse.json(
    {
      storeId: TOUCHNET_STORE_ID,
      ...payload,
    },
    { headers: { "cache-control": "private, no-store" } }
  );
}
