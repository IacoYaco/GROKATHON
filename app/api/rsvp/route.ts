import { NextResponse } from "next/server";
import { recordRsvp } from "@/lib/accounts";
import { resolveCeidSession } from "@/lib/auth-server";
import { readJsonLimited } from "@/lib/request-guards";

interface RsvpBody {
  workshopId?: string;
  workshopTitle?: string;
  startsAt?: string;
  location?: string;
}

export async function POST(request: Request) {
  const session = await resolveCeidSession(request);
  if (!session.account) {
    return NextResponse.json({ error: "Yale ID required" }, { status: 401 });
  }
  const parsed = await readJsonLimited<RsvpBody>(request, "default");
  if (!parsed.ok) return parsed.response;
  const { workshopId, workshopTitle, startsAt, location } = parsed.body;
  if (!workshopId || !workshopTitle) {
    return NextResponse.json({ error: "workshopId and workshopTitle required" }, { status: 400 });
  }
  await recordRsvp({
    workshopId,
    workshopTitle,
    startsAt,
    location: location || "",
    cursorSub: session.account.cursorSub,
    netid: session.account.netid,
    displayName: session.account.displayName,
    role: session.account.role,
  });
  return NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "private, no-store" } }
  );
}
