"use client";

import {
  ArrowRight,
  Boxes,
  CalendarCheck2,
  Camera,
  Clock3,
  PackageSearch,
  Route,
  Sparkles,
  Upload,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { GlossyOrb } from "@/components/visual/GlossyOrb";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAuth } from "@/hooks/useAuth";
import { useCeidStore } from "@/hooks/useCeidStore";
import {
  LAB_ANNOUNCEMENTS,
  SAMPLE_MATERIALS,
  stockLevel,
} from "@/lib/materials";
import { fadeUp, staggerChildren } from "@/lib/motion";
import { TOUCHNET_STORE_URL } from "@/lib/touchnet";
import { formatRelativeTime } from "@/lib/utils";
import type { MaterialItem } from "@/types/ceid";

const INTENT_CHIPS = [
  { label: "My Prusa print is stringing", targetHint: "diagnose" },
  { label: "Cut 3mm acrylic enclosure", targetHint: "sandbox" },
  { label: "Add 4× M4 holes to motor mount", targetHint: "cad" },
] as const;

const CAD_PRESETS = [
  { id: "motor-mount", name: "Drone Motor Mount" },
  { id: "arduino-case", name: "Arduino Enclosure" },
  { id: "l-bracket", name: "L-Bracket" },
];

export function HomeDashboard() {
  const { account } = useAuth();
  const {
    machines,
    rsvps,
    certs,
    setView,
    openMaterials,
    routeIntent,
  } = useCeidStore();
  const [inventory, setInventory] = useState<MaterialItem[]>(SAMPLE_MATERIALS);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [tick, setTick] = useState(Date.now());
  const [intent, setIntent] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/materials/touchnet", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        setInventory(json.items || SAMPLE_MATERIALS);
        setSyncedAt(json.fetchedAt || new Date().toISOString());
      } catch {
        if (!cancelled) {
          setInventory(
            SAMPLE_MATERIALS.map((m) => ({
              ...m,
              touchnetUrl: TOUCHNET_STORE_URL,
              source: "fallback" as const,
            }))
          );
          setSyncedAt(new Date().toISOString());
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const freeCount = machines.filter((m) => m.status === "free").length;
  const unlocked = certs.filter((c) => c.unlocked).length;
  const lowStock = inventory.filter((m) => stockLevel(m) !== "in_stock").slice(0, 4);

  const floorBars = useMemo(() => {
    const names = ["Prusa MK4", "Bambu X1C", "Epilog Laser"];
    return names.map((name) => {
      const m = machines.find((x) => x.name.includes(name.split(" ")[0]!));
      return {
        name,
        status: m?.status || "offline",
        at: m?.reportedAt,
      };
    });
  }, [machines]);

  const submitIntent = (text: string) => {
    const t = text.trim();
    if (!t) return;
    routeIntent(t);
  };

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="show"
      variants={staggerChildren}
    >
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00356B] via-[#002855] to-[#0A192F] p-5 text-white shadow-[0_20px_50px_-28px_rgba(0,53,107,0.65)] md:p-7"
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 rounded-full bg-[#286DC0]/25 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="ceid-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
              Becton Center · {freeCount} stations free
            </p>
            <h1 className="ceid-display mt-2 text-3xl font-semibold md:text-4xl">
              Welcome back, {account?.displayName?.split(" ")[0] || "maker"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">
              Command the floor: diagnose failures, route DFM, edit STL in English,
              and sync TouchNet stock before you cut.
            </p>
          </div>
          <div className="h-20 w-20 shrink-0 md:h-24 md:w-24">
            <GlossyOrb className="h-full w-full" accent="#5BA4E6" />
          </div>
        </div>

        <form
          className="relative mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            submitIntent(intent);
          }}
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-xl sm:flex-row sm:items-center">
            <Sparkles className="ml-2 hidden h-4 w-4 text-[#93C5FD] sm:block" />
            <input
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="What are you building or fixing right now? e.g. 'My Prusa print is stringing' or 'Cut 3mm acrylic enclosure'…"
              className="min-h-12 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm text-white placeholder:text-white/45 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-[#00356B]"
            >
              Route me
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTENT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setIntent(chip.label);
                  submitIntent(chip.label);
                }}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </form>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section variants={fadeUp} className="ceid-card ceid-card-hover p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]">
              <Camera className="h-5 w-5 text-[#286DC0]" />
              Snap-to-Diagnose
            </h2>
            <button
              type="button"
              onClick={() => setView("floor")}
              className="text-sm font-semibold text-[#286DC0]"
            >
              Open Floor Pulse
            </button>
          </div>
          <button
            type="button"
            onClick={() => setView("floor")}
            className="mt-4 flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#286DC0]/35 bg-[#F8FBFF] text-sm font-semibold text-[#00356B] transition hover:border-[#286DC0]"
          >
            <Upload className="h-6 w-6 text-[#286DC0]" />
            Drop a failed print photo to diagnose
            <span className="text-xs font-normal text-[#64748B]">
              Camera / upload · Grok Vision
            </span>
          </button>
        </motion.section>

        <motion.section variants={fadeUp} className="ceid-card ceid-card-hover p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]">
              <Boxes className="h-5 w-5 text-[#286DC0]" />
              AI CAD Studio
            </h2>
            <button
              type="button"
              onClick={() => setView("cad")}
              className="text-sm font-semibold text-[#286DC0]"
            >
              Open studio
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {CAD_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  routeIntent(`${p.name} — edit in CAD Studio`);
                }}
                className="flex min-h-12 items-center justify-between rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-3 text-left text-sm font-semibold text-[#0F172A] hover:border-[#286DC0]/40"
              >
                <span>{p.name}</span>
                <span className="ceid-mono text-[11px] text-[#64748B]">.stl</span>
              </button>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <motion.section variants={fadeUp} className="ceid-card p-5">
          <h2 className="text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
            Floor Pulse snapshot
          </h2>
          <ul className="mt-4 space-y-3">
            {floorBars.map((row) => (
              <li key={row.name}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{row.name}</span>
                  <StatusPill status={row.status as "free" | "in_use" | "issue" | "offline"} />
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:
                        row.status === "free"
                          ? "100%"
                          : row.status === "in_use"
                            ? "55%"
                            : "18%",
                      background:
                        row.status === "free"
                          ? "#137333"
                          : row.status === "in_use"
                            ? "#B06000"
                            : "#C5221F",
                    }}
                  />
                </div>
                {row.at && (
                  <p className="ceid-mono mt-1 text-[10px] text-[#94A3B8]">
                    {formatRelativeTime(row.at, tick)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section variants={fadeUp} className="ceid-card p-5">
          <h2 className="text-sm font-semibold tracking-[-0.02em]">
            Clearances & next workshop
          </h2>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="relative grid h-20 w-20 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#286DC0 ${(unlocked / Math.max(certs.length, 1)) * 360}deg, #E2E8F0 0)`,
              }}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center">
                <span className="ceid-mono text-sm font-bold text-[#00356B]">
                  {unlocked}/{certs.length}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Shop certs unlocked</p>
              <p className="mt-1 text-xs text-[#64748B]">
                Toggle clearances in the header strip anytime.
              </p>
            </div>
          </div>
          {rsvps[0] ? (
            <div className="mt-4 rounded-xl border border-[#E6F4EA] bg-[#E6F4EA]/40 p-3">
              <p className="ceid-mono text-[10px] uppercase tracking-wide text-[#137333]">
                Your next RSVP
              </p>
              <p className="mt-1 text-sm font-semibold">{rsvps[0].title}</p>
              <p className="ceid-mono text-xs text-[#64748B]">{rsvps[0].location}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setView("workshops")}
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#286DC0]"
            >
              <CalendarCheck2 className="h-4 w-4" />
              Browse cert workshops
            </button>
          )}
        </motion.section>

        <motion.section variants={fadeUp} className="ceid-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em]">
              <PackageSearch className="h-4 w-4 text-[#286DC0]" />
              Becton stock alerts
            </h2>
            <button
              type="button"
              onClick={() => openMaterials()}
              className="text-xs font-semibold text-[#286DC0]"
            >
              Full inventory
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {lowStock.map((item) => {
              const level = stockLevel(item);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[rgba(15,23,42,0.08)] px-3 py-2"
                >
                  <button
                    type="button"
                    className="text-left text-sm font-medium"
                    onClick={() => openMaterials(item.name)}
                  >
                    {item.name}
                    <span className="ceid-mono block text-[10px] font-normal text-[#64748B]">
                      {item.sku || item.spec}
                    </span>
                  </button>
                  <StatusPill
                    status={
                      level === "out" ? "offline" : level === "low" ? "issue" : "free"
                    }
                    label={
                      level === "out"
                        ? "Out"
                        : level === "low"
                          ? `Low · ${item.quantity}`
                          : `In · ${item.quantity}`
                    }
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[#64748B]">
            <Clock3 className="h-3.5 w-3.5" />
            Synced from TouchNet Store #239
            {syncedAt ? ` · Updated ${formatRelativeTime(syncedAt, tick)}` : ""}
          </p>
        </motion.section>
      </div>

      <motion.section variants={fadeUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { view: "dfm" as const, title: "DFM Router", blurb: "Station sequence + traps", icon: Route },
          { view: "sandbox" as const, title: "Tool Sandbox", blurb: "Laser / printer practice", icon: Wrench },
          { view: "workshops" as const, title: "Cert Sniper", blurb: "Parse + claim seats", icon: CalendarCheck2 },
          { view: "cad" as const, title: "CAD Studio", blurb: "Natural-language STL", icon: Boxes },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.view}
              type="button"
              onClick={() => setView(link.view)}
              className="ceid-card ceid-card-hover p-4 text-left"
            >
              <Icon className="h-5 w-5 text-[#286DC0]" />
              <p className="mt-3 font-semibold tracking-[-0.02em]">{link.title}</p>
              <p className="mt-1 text-sm text-[#64748B]">{link.blurb}</p>
            </button>
          );
        })}
      </motion.section>

      <motion.section variants={fadeUp} className="ceid-card p-5">
        <h2 className="text-sm font-semibold">Lab announcements</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {LAB_ANNOUNCEMENTS.map((a) => (
            <li key={a.id} className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] p-3">
              <p className="font-semibold text-[#0F172A]">{a.title}</p>
              <p className="mt-1 text-sm text-[#475569]">{a.body}</p>
              <p className="ceid-mono mt-2 text-[10px] text-[#94A3B8]">
                {formatRelativeTime(a.postedAt, tick)}
              </p>
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  );
}
