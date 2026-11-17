"use client";

import {
  Activity,
  CalendarCheck2,
  LogOut,
  Route,
  ShieldCheck,
  University,
} from "lucide-react";
import { YaleLoginGate } from "@/components/auth/YaleLoginGate";
import { FacultyConsole } from "@/components/faculty/FacultyConsole";
import { DfmPanel } from "@/components/dfm/DfmPanel";
import { FloorPulse } from "@/components/floor/FloorPulse";
import { WorkshopView } from "@/components/workshops/WorkshopView";
import { ApiModeBadge } from "@/components/ui/ApiModeBadge";
import { useAuth } from "@/hooks/useAuth";
import { useCeidStore } from "@/hooks/useCeidStore";
import { cn } from "@/lib/utils";
import type { AppView } from "@/types/ceid";

const NAV: {
  id: AppView;
  label: string;
  short: string;
  icon: typeof Activity;
  facultyOnly?: boolean;
}[] = [
  { id: "floor", label: "Floor Pulse", short: "Floor", icon: Activity },
  { id: "dfm", label: "Agentic DFM", short: "DFM", icon: Route },
  {
    id: "workshops",
    label: "Cert Sniper",
    short: "Certs",
    icon: CalendarCheck2,
  },
  {
    id: "faculty",
    label: "Faculty Console",
    short: "Faculty",
    icon: University,
    facultyOnly: true,
  },
];

export function AppShell() {
  const { loading, account, permissions, logoutYale } = useAuth();
  const { view, setView, certs, toggleCert, hydrated } = useCeidStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="ceid-skeleton h-16 w-56" />
      </div>
    );
  }

  if (!account) {
    return <YaleLoginGate />;
  }

  const profileLine =
    account.role === "faculty"
      ? `${account.displayName} · Faculty`
      : `${account.displayName} · ${account.college || "Yale"} ${account.classYear}`.trim();

  const navItems = NAV.filter(
    (item) => !item.facultyOnly || permissions.canAccessFacultyConsole
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="float-soft gloss-panel flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-[#00356B]">
                CE
              </div>
              <div>
                <p className="font-[family-name:var(--font-fraunces)] text-xl font-light italic tracking-[-0.02em] text-[#212121]">
                  CEID Co-Pilot
                </p>
                <p className="text-sm text-[#424242]">
                  {profileLine}
                  <span className="ml-2 rounded-full bg-[#E8F1FB] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#00356B]">
                    {account.role}
                  </span>
                  <span className="ml-1 text-xs text-[#6B7280]">
                    · {account.netid}
                    {account.authSource === "demo" ? " (demo CAS)" : " (Yale CAS)"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ApiModeBadge />
              <button
                type="button"
                onClick={() => logoutYale()}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/80 px-3 text-xs font-semibold text-[#424242] ring-1 ring-[#E7E7E7]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Unlink Yale ID
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Safety Certs
              {!permissions.canOverrideCerts && (
                <span className="font-normal normal-case tracking-normal text-[#9CA3AF]">
                  (personal)
                </span>
              )}
            </span>
            {certs.map((cert) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => {
                  if (!permissions.canOverrideCerts && !cert.unlocked) {
                    // students can still toggle for live demo of locks, as original spec
                  }
                  toggleCert(cert.id);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold transition",
                  cert.unlocked
                    ? "bg-[#E6F4EA] text-[#137333]"
                    : "bg-[#FCE8E6] text-[#C5221F]"
                )}
                aria-pressed={cert.unlocked}
              >
                {cert.label} {cert.unlocked ? "✓" : "🔒"}
              </button>
            ))}
            {permissions.canOverrideCerts && (
              <span className="text-xs font-medium text-[#B06000]">
                Faculty can override cert gates
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 lg:gap-6 lg:px-6 lg:py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="gloss-panel sticky top-36 space-y-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-full px-3 text-left text-sm font-medium transition",
                    active
                      ? "bg-[#286DC0] text-white shadow-[0_10px_24px_-14px_rgba(40,109,192,0.9)]"
                      : "text-[#212121] hover:bg-white/70"
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
              {view === "faculty" && <FacultyConsole />}
            </>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/80 backdrop-blur-xl lg:hidden">
        <div
          className={cn(
            "mx-auto grid max-w-lg gap-1 px-2 py-2",
            navItems.length === 4 ? "grid-cols-4" : "grid-cols-3"
          )}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[14px] text-[11px] font-semibold",
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
