"use client";

import {
  ArrowRight,
  Boxes,
  CalendarCheck2,
  Clock3,
  PackageSearch,
  Printer,
  Route,
  Sparkles,
  Wrench,
} from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAuth } from "@/hooks/useAuth";
import { useCeidStore } from "@/hooks/useCeidStore";
import {
  INVENTORY_LAST_REPORT_AT,
  LAB_ANNOUNCEMENTS,
  LAB_HOURS,
  SAMPLE_MATERIALS,
  stockLevel,
} from "@/lib/materials";
import { formatRelativeTime } from "@/lib/utils";
import type { AppView, MachineStatus } from "@/types/ceid";

const STATUS_RANK: Record<MachineStatus, number> = {
  free: 0,
  in_use: 1,
  issue: 2,
  offline: 3,
};

export function HomeDashboard() {
  const { account } = useAuth();
  const { machines, rsvps, setView, openMaterials, materialsQuery, setMaterialsQuery } =
    useCeidStore();

  const freeCount = machines.filter((m) => m.status === "free").length;
  const busyCount = machines.filter((m) => m.status === "in_use").length;
  const attentionCount = machines.filter(
    (m) => m.status === "issue" || m.status === "offline"
  ).length;

  const spotlight = [...machines]
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])
    .slice(0, 4);

  const lowStock = SAMPLE_MATERIALS.filter((m) => stockLevel(m) !== "in_stock").slice(
    0,
    4
  );

  const quickLinks: {
    view: AppView;
    title: string;
    blurb: string;
    icon: typeof Route;
  }[] = [
    {
      view: "dfm",
      title: "Active project · DFM",
      blurb: "Route your next build across CEID stations",
      icon: Route,
    },
    {
      view: "cad",
      title: "AI CAD Studio",
      blurb: "Edit a reference STL in plain English",
      icon: Boxes,
    },
    {
      view: "sandbox",
      title: "Tool Sandbox",
      blurb: "Practice laser / printer settings safely",
      icon: Wrench,
    },
    {
      view: "workshops",
      title: "Reservations & certs",
      blurb:
        rsvps.length > 0
          ? `${rsvps.length} workshop RSVP${rsvps.length === 1 ? "" : "s"} saved`
          : "Claim training seats + .ics downloads",
      icon: CalendarCheck2,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="ceid-card overflow-hidden p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#286DC0]">
              CEID studio home
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-light italic tracking-[-0.02em] text-[#00356B] md:text-4xl">
              Welcome back, {account?.displayName?.split(" ")[0] || "maker"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#6B7280] md:text-base">
              Live floor pulse, stock, hours, and project shortcuts — built for
              the Becton shop floor.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill status="free" label={`${freeCount} free`} />
            <StatusPill status="in_use" label={`${busyCount} in use`} />
            <StatusPill
              status={attentionCount ? "issue" : "certified"}
              label={
                attentionCount
                  ? `${attentionCount} need attention`
                  : "Floor clear"
              }
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="ceid-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#00356B]">
              <Printer className="h-5 w-5 text-[#286DC0]" />
              Live studio equipment
            </h2>
            <button
              type="button"
              onClick={() => setView("floor")}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#286DC0]"
            >
              Open Floor Pulse
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {spotlight.map((m) => (
              <article
                key={m.id}
                className="rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FA] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#00356B]">{m.name}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{m.material}</p>
                  </div>
                  <StatusPill status={m.status} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ceid-card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#00356B]">
              <PackageSearch className="h-5 w-5 text-[#286DC0]" />
              Materials quick-search
            </h2>
            <button
              type="button"
              onClick={() => openMaterials()}
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#286DC0]"
            >
              Full inventory
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              openMaterials(materialsQuery);
            }}
          >
            <input
              value={materialsQuery}
              onChange={(e) => setMaterialsQuery(e.target.value)}
              placeholder="Search plywood, M3, PETG…"
              className="min-h-12 flex-1 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-sm"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white"
            >
              Search
            </button>
          </form>
          <ul className="mt-3 space-y-2">
            {lowStock.map((item) => {
              const level = stockLevel(item);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm"
                >
                  <button
                    type="button"
                    className="text-left font-medium text-[#00356B]"
                    onClick={() => openMaterials(item.name)}
                  >
                    {item.name}
                    <span className="block text-xs font-normal text-[#6B7280]">
                      {item.spec}
                    </span>
                  </button>
                  <StatusPill
                    status={
                      level === "out"
                        ? "offline"
                        : level === "low"
                          ? "issue"
                          : "free"
                    }
                    label={
                      level === "out"
                        ? "Out"
                        : level === "low"
                          ? "Low"
                          : "In stock"
                    }
                  />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Clock3 className="h-3.5 w-3.5" />
            Inventory report synced {formatRelativeTime(INVENTORY_LAST_REPORT_AT)}
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="ceid-card p-5">
          <h2 className="text-lg font-semibold text-[#00356B]">
            Lab hours & announcements
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {LAB_HOURS.map((row) => (
              <div
                key={row.day}
                className="flex items-center justify-between rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[#00356B]">{row.day}</span>
                <span className="text-[#6B7280]">{row.hours}</span>
              </div>
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {LAB_ANNOUNCEMENTS.map((a) => (
              <li
                key={a.id}
                className="rounded-[12px] border border-[#E5E7EB] bg-white p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#00356B]">{a.title}</p>
                  <StatusPill
                    status={
                      a.tag === "safety"
                        ? "offline"
                        : a.tag === "supply"
                          ? "issue"
                          : "free"
                    }
                    label={a.tag}
                  />
                </div>
                <p className="mt-1 text-sm text-[#4B5563]">{a.body}</p>
                <p className="mt-2 text-xs text-[#9CA3AF]">
                  {formatRelativeTime(a.postedAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="ceid-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#00356B]">
            <Sparkles className="h-5 w-5 text-[#286DC0]" />
            Reservations & active projects
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.view}
                  type="button"
                  onClick={() => setView(link.view)}
                  className="rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FA] p-4 text-left transition hover:border-[#286DC0] hover:bg-white"
                >
                  <Icon className="h-5 w-5 text-[#286DC0]" />
                  <p className="mt-3 font-semibold text-[#00356B]">
                    {link.title}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">{link.blurb}</p>
                </button>
              );
            })}
          </div>
          {rsvps.length > 0 && (
            <div className="mt-4 rounded-[12px] border border-[#E6F4EA] bg-[#E6F4EA]/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#137333]">
                Your next RSVP
              </p>
              <p className="mt-1 text-sm font-semibold text-[#00356B]">
                {rsvps[0].title}
              </p>
              <p className="text-xs text-[#6B7280]">{rsvps[0].location}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
