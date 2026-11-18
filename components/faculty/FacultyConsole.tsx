"use client";

import { Loader2, Megaphone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface RosterRow {
  workshopId: string;
  workshopTitle: string;
  location: string;
  netid: string;
  displayName: string;
  role: string;
  claimedAt: string;
}

interface Announcement {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export function FacultyConsole() {
  const { permissions, account } = useAuth();
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, a] = await Promise.all([
        fetch("/api/faculty/roster", { cache: "no-store" }),
        fetch("/api/faculty/announcements", { cache: "no-store" }),
      ]);
      if (!r.ok) throw new Error("Could not load RSVP roster");
      const rj = await r.json();
      const aj = a.ok ? await a.json() : { announcements: [] };
      setRoster(rj.roster || []);
      setAnnouncements(aj.announcements || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load faculty data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.canAccessFacultyConsole) void load();
  }, [permissions.canAccessFacultyConsole]);

  if (!permissions.canAccessFacultyConsole) {
    return (
      <div className="gloss-panel rounded-[20px] p-6 text-sm text-[#424242]">
        Faculty Console is available after linking a Yale ID with a faculty /
        staff affiliation.
      </div>
    );
  }

  const post = async () => {
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/faculty/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Post failed");
      }
      setBody("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Post failed");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ceid-display text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">
          Faculty Console
        </h1>
        <p className="mt-1 text-sm text-[#424242]">
          Oversight for {account?.displayName || account?.netid} — RSVP roster
          and floor announcements students see on Floor Pulse.
        </p>
      </div>

      {error && <p className="text-sm text-[#C5221F]">{error}</p>}

      <section className="gloss-panel rounded-[20px] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
          <Megaphone className="h-4 w-4 text-[#286DC0]" />
          Floor announcement
        </h2>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="e.g. Epilog #2 offline until exhaust repair — use #1 only."
          className="mt-3 w-full rounded-[16px] border border-[#E7E7E7] bg-white/80 px-3 py-3 text-sm"
        />
        <button
          type="button"
          disabled={posting || !body.trim()}
          onClick={post}
          className="glossy-pill mt-3 inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Broadcast to floor
        </button>
      </section>

      <section className="gloss-panel rounded-[20px] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
          <Users className="h-4 w-4 text-[#286DC0]" />
          Workshop RSVP roster
        </h2>
        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#6B7280]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : roster.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">No RSVPs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#E7E7E7]">
            {roster.map((row, i) => (
              <li
                key={`${row.workshopId}-${row.netid}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-[#212121]">
                    {row.displayName}{" "}
                    <span className="ceid-mono font-normal text-[#64748B]">
                      ({row.netid})
                    </span>
                  </p>
                  <p className="text-[#424242]">{row.workshopTitle}</p>
                </div>
                <span className="rounded-full bg-[#E8F1FB] px-2.5 py-1 text-xs font-semibold text-[#00356B]">
                  {row.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {announcements.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
            Recent broadcasts
          </h2>
          {announcements.map((a) => (
            <article key={a.id} className="gloss-panel rounded-[16px] p-4 text-sm">
              <p className="font-medium text-[#212121]">{a.body}</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                {a.authorName} · {new Date(a.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
