import { NextResponse } from "next/server";
import {
  createAnnouncement,
  listAnnouncements,
} from "@/lib/accounts";
import { resolveCeidSession } from "@/lib/auth-server";
import { readJsonLimited } from "@/lib/request-guards";

export async function GET(request: Request) {
  const session = await resolveCeidSession(request);
  if (!session.account) {
    return NextResponse.json({ error: "Yale ID required" }, { status: 401 });
  }
  const rows = await listAnnouncements();
  return NextResponse.json(
    {
      announcements: rows.map((r) => ({
        id: Number(r.id),
        authorName: r.author_name,
        body: r.body,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    },
    { headers: { "cache-control": "private, no-store" } }
  );
}

export async function POST(request: Request) {
  const session = await resolveCeidSession(request);
  if (!session.account || !session.permissions.canPostAnnouncements) {
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });
  }
  const parsed = await readJsonLimited<{ body?: string }>(request, "default");
  if (!parsed.ok) return parsed.response;
  const body = parsed.body.body?.trim();
  if (!body || body.length > 500) {
    return NextResponse.json({ error: "Announcement required (max 500 chars)" }, { status: 400 });
  }
  await createAnnouncement({
    authorSub: session.account.cursorSub,
    authorName: session.account.displayName || session.account.netid,
    body,
  });
  return NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "private, no-store" } }
  );
}
