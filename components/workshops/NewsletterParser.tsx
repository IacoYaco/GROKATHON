"use client";

import {
  CalendarPlus,
  Filter,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCeidStore } from "@/hooks/useCeidStore";
import { downloadIcs } from "@/lib/ics";
import { SAMPLE_NEWSLETTER } from "@/lib/sample-data";
import type { ApiEnvelope, CertId, Workshop } from "@/types/ceid";

const CERT_LABEL: Record<CertId, string> = {
  laser_cutter: "Laser Cutter",
  "3d_printing": "3D Printing",
  woodshop: "Woodshop",
  metal_shop: "Metal Shop",
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function NewsletterParser() {
  const {
    setApiMode,
    dfmRequiredCerts,
    certs,
    certFilter,
    setCertFilter,
    claimRsvp,
    isRsvped,
    rsvps,
  } = useCeidStore();
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  const lockedNeeded = new Set(
    dfmRequiredCerts.filter(
      (id) => !certs.find((c) => c.id === id)?.unlocked
    )
  );

  const visible = workshops.filter((w) =>
    certFilter ? w.grantsCert === certFilter : true
  );

  const parse = async () => {
    if (!emailText.trim()) {
      setError("Paste newsletter text first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const json = (await res.json()) as ApiEnvelope<Workshop[]> & {
        error?: string;
      };
      if (!res.ok && !json.data) {
        throw new Error(json.error || "Parse failed");
      }
      setApiMode(json.mode);
      setWorkshops(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onClaim = async (workshop: Workshop) => {
    const rsvp = claimRsvp(workshop);
    downloadIcs(rsvp);
    try {
      await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId: workshop.id,
          workshopTitle: workshop.title,
          startsAt: workshop.startsAt,
          location: workshop.location,
        }),
      });
    } catch {
      // local RSVP + .ics already succeeded
    }
  };

  return (
    <div className="space-y-4">
      <section className="ceid-card space-y-3 p-4 md:p-5">
        <label className="block text-sm font-medium text-[#374151]">
          Paste CEID weekly announcement email
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={10}
            placeholder="Forward or paste the raw weekly email…"
            className="mt-1 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-3 font-mono text-xs md:text-sm"
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setEmailText(SAMPLE_NEWSLETTER)}
            className="inline-flex min-h-12 items-center justify-center rounded-[12px] border border-[#286DC0] bg-white px-4 text-sm font-semibold text-[#286DC0]"
          >
            Paste Sample CEID Weekly Email
          </button>
          <button
            type="button"
            onClick={parse}
            disabled={loading}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Grok extracting trainings...
              </>
            ) : (
              "Parse with Grok"
            )}
          </button>
        </div>
        {error && <p className="text-sm text-[#C5221F]">{error}</p>}
      </section>

      {certFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#FEF7E0] bg-[#FEF7E0] px-3 py-2 text-sm text-[#B06000]">
          <Filter className="h-4 w-4" />
          Cert Sniper filter: {CERT_LABEL[certFilter]}
          <button
            type="button"
            onClick={() => setCertFilter(null)}
            className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-full bg-white px-3 font-semibold"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      )}

      {loading && (
        <div className="ceid-card space-y-3 p-5">
          <div className="ceid-skeleton h-28 w-full" />
          <div className="ceid-skeleton h-28 w-full" />
        </div>
      )}

      {!loading && workshops.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#00356B]">
            Extracted Training Cards
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((w) => {
              const priority =
                w.grantsCert != null && lockedNeeded.has(w.grantsCert);
              const claimed = isRsvped(w.id);
              return (
                <article
                  key={w.id}
                  className={`ceid-card p-4 ${
                    priority ? "ring-2 ring-[#B06000]" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#00356B]">{w.title}</h3>
                    {priority && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF7E0] px-2.5 py-1 text-xs font-semibold text-[#B06000]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Priority Match
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-[#374151]">
                    Grants:{" "}
                    <span className="font-semibold">
                      {w.grantsCert
                        ? `${w.grantsLabel} ${
                            certs.find((c) => c.id === w.grantsCert)?.unlocked
                              ? "✓"
                              : "🔒"
                          }`
                        : w.grantsLabel}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {formatWhen(w.startsAt)} → {formatWhen(w.endsAt)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#286DC0]">
                    {w.location}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill
                      status={w.seatsAvailable > 0 ? "free" : "offline"}
                      label={`${w.seatsAvailable}/${w.seatsTotal} seats`}
                    />
                    {w.prerequisites.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-[#F3F6F9] px-2.5 py-1 text-xs text-[#4B5563]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={claimed || w.seatsAvailable <= 0}
                    onClick={() => onClaim(w)}
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white disabled:bg-[#9CA3AF]"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    {claimed
                      ? "Spot claimed — .ics saved"
                      : "Claim Spot + Download .ics"}
                  </button>
                </article>
              );
            })}
          </div>
          {visible.length === 0 && (
            <p className="text-sm text-[#6B7280]">
              No workshops match the current Cert Sniper filter.
            </p>
          )}
        </section>
      )}

      {rsvps.length > 0 && (
        <section className="ceid-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">
            Your RSVPs
          </h2>
          <ul className="mt-2 space-y-2">
            {rsvps.map((r) => (
              <li
                key={r.workshopId}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium text-[#00356B]">{r.title}</span>
                <button
                  type="button"
                  className="min-h-11 rounded-[12px] border border-[#E5E7EB] px-3 font-semibold text-[#286DC0]"
                  onClick={() => downloadIcs(r)}
                >
                  Re-download .ics
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
