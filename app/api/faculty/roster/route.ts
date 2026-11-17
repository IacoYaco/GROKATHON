import { NextResponse } from "next/server";
import { listRsvpRoster } from "@/lib/accounts";
import { resolveCeidSession } from "@/lib/auth-server";

export async function GET(request: Request) {
  const session = await resolveCeidSession(request);
  if (!session.account || !session.permissions.canViewRsvpRoster) {
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });
  }
  const rows = await listRsvpRoster();
  return NextResponse.json(
    {
      roster: rows.map((r) => ({
        workshopId: r.workshop_id,
        workshopTitle: r.workshop_title,
        startsAt: r.starts_at ? new Date(r.starts_at).toISOString() : null,
        location: r.location,
        netid: r.netid,
        displayName: r.display_name,
        role: r.role,
        claimedAt: new Date(r.claimed_at).toISOString(),
      })),
    },
    { headers: { "cache-control": "private, no-store" } }
  );
}
