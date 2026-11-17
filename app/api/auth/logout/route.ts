import { NextResponse } from "next/server";
import { getIdentity } from "../../../../cursor/identity";
import { unlinkAccount } from "@/lib/accounts";

export async function POST(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified || identity.kind === "key") {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  await unlinkAccount(identity.sub);
  return NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "private, no-store" } }
  );
}
