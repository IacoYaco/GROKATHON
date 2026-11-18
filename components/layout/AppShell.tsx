"use client";

import {
  Activity,
  Boxes,
  CalendarCheck2,
  Home,
  LogOut,
  PackageSearch,
  Route,
  ShieldCheck,
  University,
  Wrench,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { YaleLoginGate } from "@/components/auth/YaleLoginGate";
import { CadStudio } from "@/components/cad/CadStudio";
import { FacultyConsole } from "@/components/faculty/FacultyConsole";
import { DfmPanel } from "@/components/dfm/DfmPanel";
import { FloorPulse } from "@/components/floor/FloorPulse";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { MaterialsStock } from "@/components/materials/MaterialsStock";
import { ToolSandbox } from "@/components/sandbox/ToolSandbox";
import { WorkshopView } from "@/components/workshops/WorkshopView";
import { ApiModeBadge } from "@/components/ui/ApiModeBadge";
import { useAuth } from "@/hooks/useAuth";
import { useCeidStore } from "@/hooks/useCeidStore";
import { CEID_SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AppView } from "@/types/ceid";

const NAV: {
  id: AppView;
  label: string;
  short: string;
  icon: typeof Activity;
  facultyOnly?: boolean;
}[] = [
  { id: "home", label: "Command Home", short: "Home", icon: Home },
  { id: "floor", label: "Floor Pulse", short: "Floor", icon: Activity },
  { id: "dfm", label: "DFM Router", short: "DFM", icon: Route },
  { id: "cad", label: "AI CAD Studio", short: "CAD", icon: Boxes },
  { id: "sandbox", label: "Tool Sandbox", short: "Sandbox", icon: Wrench },
  { id: "workshops", label: "Cert Sniper", short: "Certs", icon: CalendarCheck2 },
  {
    id: "materials",
    label: "Materials (TouchNet)",
    short: "Stock",
    icon: PackageSearch,
  },
  {
    id: "faculty",
    label: "Faculty Console",
    short: "Faculty",
    icon: University,
    facultyOnly: true,
  },
];

const VIEW_LABEL: Record<AppView, string> = {
  home: "Command Home",
  floor: "Floor Pulse",
  materials: "Materials · TouchNet",
  dfm: "DFM Router",
  workshops: "Cert Sniper",
  cad: "AI CAD Studio",
  sandbox: "Tool Sandbox",
  faculty: "Faculty Console",
};

export function AppShell() {
  const { loading, account, permissions, logoutYale } = useAuth();
  const { view, setView, certs, toggleCert, machines } = useCeidStore();

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

  const freePrinters = machines.filter(
    (m) => m.category === "3d_printer" && m.status === "free"
  ).length;
  const totalPrinters = machines.filter((m) => m.category === "3d_printer").length;

  const navItems = NAV.filter(
    (item) => !item.facultyOnly || permissions.canAccessFacultyConsole
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="sticky top-0 z-40 hidden h-screen w-60 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur-md lg:block">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200/80 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00356B] text-xs font-bold text-white">
            CE
          </div>
          <div>
            <p className="ceid-display text-sm font-semibold tracking-[-0.03em]">
              CEID Co-Pilot
            </p>
            <p className="ceid-mono text-[10px] text-[#64748B]">Becton Center</p>
          </div>
        </div>
        <nav className="space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "relative flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium transition",
                  active ? "text-[#00356B]" : "text-[#475569] hover:bg-white/80 hover:text-[#0F172A]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="activeSidebarIndicator"
                    className="absolute inset-0 rounded-xl bg-[#E8F1FB] ring-1 ring-[#286DC0]/20"
                    transition={CEID_SPRING}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl lg:px-6">
          <div className="min-w-0 flex-1">
            <p className="ceid-mono text-[10px] uppercase tracking-[0.14em] text-[#94A3B8]">
              Workspace
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-sm font-semibold tracking-[-0.02em] text-[#0F172A]">
                {VIEW_LABEL[view]}
              </h1>
              <span className="ceid-mono hidden rounded-full bg-[#E6F4EA] px-2 py-0.5 text-[11px] font-semibold text-[#137333] sm:inline-flex">
                <span className="ceid-live-dot mr-1.5 self-center" />
                {freePrinters}/{totalPrinters} Printers Free
              </span>
            </div>
          </div>

          <div className="hidden max-w-xl flex-wrap items-center justify-center gap-1.5 md:flex">
            <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Clearance
            </span>
            {certs.map((cert) => (
              <motion.button
                key={cert.id}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={CEID_SPRING}
                onClick={() => toggleCert(cert.id)}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full px-2.5 text-xs font-semibold",
                  cert.unlocked
                    ? "bg-[#E6F4EA] text-[#137333] ring-1 ring-[#137333]/15"
                    : "bg-[#FCE8E6] text-[#C5221F] ring-1 ring-[#C5221F]/15"
                )}
                aria-pressed={cert.unlocked}
              >
                {cert.label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ApiModeBadge />
            <div className="hidden items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-3 py-1.5 sm:flex">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#0F172A]">
                  {account.displayName}
                </p>
                <p className="ceid-mono text-[10px] text-[#64748B]">
                  {account.netid}
                  {account.authSource === "demo" ? " · demo" : " · CAS"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => logoutYale()}
                className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
            <button
              type="button"
              onClick={() => logoutYale()}
              className="inline-flex min-h-10 items-center rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-2 text-[#475569] sm:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200/80 bg-white/70 px-4 py-2 md:hidden">
          {certs.map((cert) => (
            <button
              key={cert.id}
              type="button"
              onClick={() => toggleCert(cert.id)}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full px-2.5 text-xs font-semibold",
                cert.unlocked
                  ? "bg-[#E6F4EA] text-[#137333]"
                  : "bg-[#FCE8E6] text-[#C5221F]"
              )}
            >
              {cert.label}
            </button>
          ))}
        </div>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 lg:px-6 lg:pb-8 lg:pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "home" && <HomeDashboard />}
              {view === "floor" && <FloorPulse />}
              {view === "materials" && <MaterialsStock />}
              {view === "dfm" && <DfmPanel />}
              {view === "workshops" && <WorkshopView />}
              {view === "cad" && <CadStudio />}
              {view === "sandbox" && <ToolSandbox />}
              {view === "faculty" && <FacultyConsole />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-3 z-40 px-3 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className="relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="activeMobileIndicator"
                    className="absolute inset-0 rounded-xl bg-[#E8F1FB]"
                    transition={CEID_SPRING}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-5 w-5",
                    active ? "text-[#286DC0]" : "text-[#94A3B8]"
                  )}
                />
                <span
                  className={cn(
                    "relative z-10",
                    active ? "text-[#00356B]" : "text-[#64748B]"
                  )}
                >
                  {item.short}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setView("materials")}
            className="relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold"
          >
            {view === "materials" && (
              <motion.span
                layoutId="activeMobileIndicator"
                className="absolute inset-0 rounded-xl bg-[#E8F1FB]"
                transition={CEID_SPRING}
              />
            )}
            <PackageSearch
              className={cn(
                "relative z-10 h-5 w-5",
                view === "materials" ? "text-[#286DC0]" : "text-[#94A3B8]"
              )}
            />
            <span
              className={cn(
                "relative z-10",
                view === "materials" ? "text-[#00356B]" : "text-[#64748B]"
              )}
            >
              Stock
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
