"use client";

import {
  Activity,
  CalendarCheck2,
  Route,
  ShieldCheck,
} from "lucide-react";
import { ApiModeBadge } from "@/components/ui/ApiModeBadge";
import { useCeidStore } from "@/hooks/useCeidStore";
import { cn } from "@/lib/utils";
import type { AppView } from "@/types/ceid";
import { DfmPanel } from "@/components/dfm/DfmPanel";
import { FloorPulse } from "@/components/floor/FloorPulse";
import { WorkshopView } from "@/components/workshops/WorkshopView";

const NAV: { id: AppView; label: string; short: string; icon: typeof Activity }[] =
  [
    { id: "floor", label: "Floor Pulse", short: "Floor", icon: Activity },
    { id: "dfm", label: "Agentic DFM", short: "DFM", icon: Route },
    {
      id: "workshops",
      label: "Cert Sniper",
      short: "Certs",
      icon: CalendarCheck2,
    },
  ];

export function AppShell() {
  const { view, setView, certs, toggleCert, hydrated } = useCeidStore();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#00356B] text-sm font-bold text-white">
                CE
              </div>
              <div>
                <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[#00356B]">
                  CEID Co-Pilot
                </p>
                <p className="text-sm text-[#6B7280]">
                  Huy Anh • Pierson &apos;30
                </p>
              </div>
            </div>
            <ApiModeBadge />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Safety Certs
            </span>
            {certs.map((cert) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => toggleCert(cert.id)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold transition",
                  cert.unlocked
                    ? "bg-[#E6F4EA] text-[#137333] hover:brightness-95"
                    : "bg-[#FCE8E6] text-[#C5221F] hover:brightness-95"
                )}
                aria-pressed={cert.unlocked}
              >
                {cert.label} {cert.unlocked ? "✓" : "🔒"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="ceid-card sticky top-36 space-y-1 p-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-[10px] px-3 text-left text-sm font-medium transition",
                    active
                      ? "bg-[#286DC0] text-white"
                      : "text-[#00356B] hover:bg-[#F3F6F9]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-4 lg:px-0 lg:pb-6 lg:pt-0">
          {!hydrated ? (
            <div className="space-y-4">
              <div className="ceid-skeleton h-40 w-full" />
              <div className="ceid-skeleton h-64 w-full" />
            </div>
          ) : (
            <>
              {view === "floor" && <FloorPulse />}
              {view === "dfm" && <DfmPanel />}
              {view === "workshops" && <WorkshopView />}
            </>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 py-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[10px] text-xs font-semibold",
                  active ? "bg-[#E8F1FB] text-[#286DC0]" : "text-[#6B7280]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.short}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
