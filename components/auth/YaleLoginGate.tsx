"use client";

import {
  ArrowRight,
  Boxes,
  Camera,
  GraduationCap,
  Loader2,
  PackageSearch,
  Route,
  Shield,
  University,
  Wrench,
} from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { GlossyOrb } from "@/components/visual/GlossyOrb";
import { useAuth } from "@/hooks/useAuth";
import { CEID_EASE, CEID_SPRING, fadeUp, staggerChildren } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "diagnose", label: "Snap-to-Diagnose", icon: Camera },
  { id: "cad", label: "AI CAD Studio", icon: Boxes },
  { id: "sandbox", label: "Tool Sandbox", icon: Wrench },
  { id: "dfm", label: "DFM + Stock", icon: Route },
  { id: "certs", label: "Cert Sniper", icon: PackageSearch },
] as const;

export function YaleLoginGate() {
  const {
    loading,
    casLive,
    demoAuthAllowed,
    demoFacultyAllowed,
    demoLogin,
    startCasLogin,
    simulated,
  } = useAuth();
  const [busy, setBusy] = useState<"student" | "faculty" | "cas" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<(typeof MODULES)[number]["id"]>("diagnose");
  const [cadMode, setCadMode] = useState<"raw" | "grok">("raw");
  const [laserPower, setLaserPower] = useState(65);

  const heroRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start end", "end start"],
  });
  const progressX = useTransform(scrollYProgress, [0.1, 0.85], [0, 1]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, CEID_SPRING);
  const sy = useSpring(my, CEID_SPRING);
  const orbTransform = useMotionTemplate`translate3d(${sx}px, ${sy}px, 0)`;

  const laserTone = useMemo(() => {
    if (laserPower > 78) return { label: "Scorched", tone: "text-[#C5221F]" };
    if (laserPower < 45) return { label: "Incomplete cut", tone: "text-[#B06000]" };
    return { label: "Clean Acrylic Edge", tone: "text-[#137333]" };
  }, [laserPower]);

  const onDemo = async (role: "student" | "faculty") => {
    setBusy(role);
    setError(null);
    try {
      await demoLogin({
        role,
        netid: role === "faculty" ? "ceidfac" : "huyanh",
        displayName: role === "faculty" ? "Prof. Rivera" : "Huy Anh",
        college: role === "faculty" ? "CEID Faculty" : "Pierson",
        classYear: role === "student" ? "'30" : "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(null);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen text-[#0F172A]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00356B] text-[11px] font-bold text-white">
              CE
            </div>
            <span className="ceid-display text-sm font-semibold tracking-[-0.03em]">
              CEID Co-Pilot
            </span>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EA] px-2.5 py-1 text-[11px] font-semibold text-[#137333]">
              <span className="ceid-live-dot" />
              Becton Center · Open · xAI Grok Connected
            </span>
            <nav className="flex items-center gap-3 text-xs font-semibold text-[#475569]">
              <button type="button" onClick={() => scrollTo("capabilities")} className="hover:text-[#00356B]">
                Capabilities
              </button>
              <button type="button" onClick={() => scrollTo("sandbox-preview")} className="hover:text-[#00356B]">
                Live Sandbox
              </button>
              <button type="button" onClick={() => scrollTo("architecture")} className="hover:text-[#00356B]">
                Architecture
              </button>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => scrollTo("auth-card")}
            className="inline-flex min-h-10 items-center rounded-xl bg-[#00356B] px-3 text-xs font-semibold text-white shadow-lg shadow-[#00356B]/20"
          >
            NetID Sign In
          </button>
        </div>
      </header>

      <section
        ref={heroRef}
        className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 pb-16 pt-24 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerChildren}
          className="space-y-6"
        >
          <motion.div variants={fadeUp} className="ceid-shimmer inline-flex rounded-full border border-[#286DC0]/25 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#286DC0]">
            Yale CEID · Powered by xAI Grok
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="ceid-display max-w-xl text-4xl font-semibold text-[#0F172A] sm:text-5xl md:text-6xl"
          >
            From 11:30 PM sketch to{" "}
            <span className="ceid-gradient-text">working hardware.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="max-w-xl text-base leading-relaxed text-[#475569] md:text-lg">
            Diagnose failed prints with Grok Vision, modify STL files in plain English,
            test laser settings safely, and sync Becton stock—without waiting weeks for
            workshops.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
            {MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFocus(m.id)}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all duration-300",
                    focus === m.id
                      ? "border-[#286DC0] bg-[#E8F1FB] text-[#00356B]"
                      : "border-[rgba(15,23,42,0.08)] bg-white text-[#475569] hover:-translate-y-0.5"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              );
            })}
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="ceid-card relative overflow-hidden p-4"
          >
            <PreviewPane focus={focus} cadMode={cadMode} setCadMode={setCadMode} laserPower={laserPower} setLaserPower={setLaserPower} laserTone={laserTone} />
          </motion.div>
        </motion.div>

        <motion.div
          id="auth-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: CEID_EASE, delay: 0.1 }}
          className="ceid-card p-5 md:p-6"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
            my.set(((e.clientY - rect.top) / rect.height - 0.5) * 8);
          }}
          onPointerLeave={() => {
            mx.set(0);
            my.set(0);
          }}
        >
          <motion.div style={{ transform: orbTransform }} className="mx-auto h-36 w-36 md:h-44 md:w-44">
            <GlossyOrb className="h-full w-full" accent="#286DC0" />
          </motion.div>
          <h2 className="ceid-display mt-4 text-center text-xl font-semibold tracking-[-0.03em]">
            Launch into Becton
          </h2>
          <p className="mt-1 text-center text-sm text-[#475569]">
            Judges: use Instant Preview. Students: NetID when CAS is live.
          </p>

          <button
            type="button"
            disabled={Boolean(busy) || !casLive}
            onClick={() => {
              setBusy("cas");
              startCasLogin();
            }}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00356B] text-sm font-semibold text-white shadow-lg shadow-[#00356B]/20 hover:bg-[#002855] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "cas" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <University className="h-4 w-4" />
            )}
            {casLive
              ? "Continue with Yale NetID (CAS)"
              : "Yale CAS (awaiting ITS registration)"}
          </button>

          {demoAuthAllowed && (
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[rgba(15,23,42,0.08)]" />
                <p className="ceid-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Or Instant Preview
                </p>
                <div className="h-px flex-1 bg-[rgba(15,23,42,0.08)]" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={Boolean(busy) || loading}
                  onClick={() => onDemo("student")}
                  className="inline-flex min-h-12 flex-col items-start justify-center rounded-xl border border-[rgba(15,23,42,0.08)] bg-white px-3 text-left hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,53,107,0.12)]"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00356B]">
                    {busy === "student" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <GraduationCap className="h-3.5 w-3.5" />
                    )}
                    Enter as Student Builder
                  </span>
                  <span className="ceid-mono mt-0.5 text-[11px] text-[#64748B]">
                    Pierson &apos;30 · MechE
                  </span>
                </button>
                {demoFacultyAllowed && (
                  <button
                    type="button"
                    disabled={Boolean(busy) || loading}
                    onClick={() => onDemo("faculty")}
                    className="inline-flex min-h-12 flex-col items-start justify-center rounded-xl bg-[#00356B] px-3 text-left text-white hover:bg-[#002855]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                      {busy === "faculty" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Shield className="h-3.5 w-3.5" />
                      )}
                      Enter as Faculty / Fellow
                    </span>
                    <span className="ceid-mono mt-0.5 text-[11px] text-white/70">
                      Admin & Roster View
                    </span>
                  </button>
                )}
              </div>
              {error && <p className="mt-3 text-sm text-[#C5221F]">{error}</p>}
              {simulated && (
                <p className="mt-3 text-xs text-[#64748B]">
                  Local preview uses a simulated Cursor viewer.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </section>

      <section id="capabilities" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerChildren}
        >
          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.18em] text-[#286DC0]">
            Everything inside Becton Center, connected
          </motion.p>
          <motion.h2 variants={fadeUp} className="ceid-display mt-2 max-w-2xl text-3xl font-semibold md:text-4xl">
            Five tools. One floor pulse.
          </motion.h2>
          <div className="mt-8 grid gap-4 md:grid-cols-6">
            <BentoCard className="md:col-span-3" title="Snap-to-Diagnose" blurb="Grok Vision reads failed prints and returns exact fix parameters.">
              <div className="relative h-28 overflow-hidden rounded-xl bg-[#0B1120]">
                <div className="absolute inset-4 border border-dashed border-[#286DC0]/40" />
                <div className="ceid-scanline top-0" />
                <span className="absolute bottom-3 right-3 rounded-full bg-[#E6F4EA] px-2 py-1 text-[11px] font-semibold text-[#137333]">
                  Z-Offset Calibrated
                </span>
              </div>
            </BentoCard>
            <BentoCard className="md:col-span-3" title="AI CAD Studio" blurb="Flip between raw reference STL and Grok parametric output.">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCadMode("raw")}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                    cadMode === "raw" ? "bg-[#00356B] text-white" : "bg-[#F1F5F9] text-[#475569]"
                  )}
                >
                  Raw Reference STL
                </button>
                <button
                  type="button"
                  onClick={() => setCadMode("grok")}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                    cadMode === "grok" ? "bg-[#00356B] text-white" : "bg-[#F1F5F9] text-[#475569]"
                  )}
                >
                  Grok Output (+4× M4)
                </button>
              </div>
              <div className="mt-3 grid h-20 place-items-center rounded-xl bg-[#0B1120] text-xs text-white/70">
                {cadMode === "raw" ? "60 × 60 × 4 mm plate" : "80 × 80 × 5 mm · 4× Ø4.2 holes"}
              </div>
            </BentoCard>
            <BentoCard id="sandbox-preview" className="md:col-span-2" title="Tool Sandbox" blurb="Live laser power preview.">
              <label className="block text-xs font-semibold text-[#475569]">
                Laser Power: <span className="ceid-mono text-[#0F172A]">{laserPower}%</span>
              </label>
              <input
                type="range"
                min={20}
                max={95}
                value={laserPower}
                onChange={(e) => setLaserPower(Number(e.target.value))}
                className="ceid-fader mt-2 w-full"
              />
              <p className={cn("mt-2 text-sm font-semibold", laserTone.tone)}>
                {laserTone.label}
              </p>
            </BentoCard>
            <BentoCard className="md:col-span-2" title="DFM + TouchNet" blurb="Sketch → bin → checkout.">
              <div className="flex items-center justify-between gap-1 text-[11px] font-semibold">
                {["Sketch", "Bin B4", "TouchNet"].map((n, i) => (
                  <div key={n} className="flex items-center gap-1">
                    <span className="rounded-full bg-[#E8F1FB] px-2 py-1 text-[#00356B]">{n}</span>
                    {i < 2 && <ArrowRight className="h-3 w-3 text-[#94A3B8]" />}
                  </div>
                ))}
              </div>
            </BentoCard>
            <BentoCard className="md:col-span-2" title="Cert Sniper" blurb="Messy email → clean .ics pass.">
              <div className="grid gap-2 text-[11px]">
                <div className="rounded-lg bg-[#F8FAFC] p-2 text-[#64748B] line-through">
                  Fwd: laser workshop?? seats left??
                </div>
                <div className="rounded-lg bg-[#E6F4EA] p-2 font-semibold text-[#137333]">
                  Laser Cert · Thu 6:00 PM · .ics ready
                </div>
              </div>
            </BentoCard>
          </div>
        </motion.div>
      </section>

      <section
        id="architecture"
        ref={timelineRef}
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#286DC0]">
          Fabrication workflow
        </p>
        <h2 className="ceid-display mt-2 text-3xl font-semibold md:text-4xl">
          Three steps from idea to floor.
        </h2>
        <div className="relative mt-10">
          <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-[#E2E8F0]" />
          <motion.div
            style={{ scaleX: progressX }}
            className="absolute left-0 top-5 h-1 origin-left rounded-full bg-[#286DC0] shadow-[0_0_16px_rgba(40,109,192,0.45)]"
          />
          <div className="relative grid gap-6 md:grid-cols-3">
            {[
              ["01", "Snap or Describe", "Drop a failed print or write the build brief."],
              ["02", "Simulate & Modify", "Tune CAD, laser, and DFM before you burn material."],
              ["03", "Fabricate on Floor", "Claim certs, check TouchNet stock, cut with confidence."],
            ].map(([n, title, body]) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: CEID_EASE }}
                className="ceid-card p-5 pt-8"
              >
                <span className="ceid-mono absolute -top-0 left-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-[#286DC0] ring-4 ring-[#F6F8FA]">
                  {n}
                </span>
                <h3 className="mt-2 font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="mt-2 text-sm text-[#475569]">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="ceid-card flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center md:p-8">
          <div>
            <h2 className="ceid-display text-2xl font-semibold md:text-3xl">
              Ready when the shop is.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#475569]">
              Launch CEID Co-Pilot and jump straight into diagnose, CAD, sandbox, or stock.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (demoAuthAllowed) void onDemo("student");
              else scrollTo("auth-card");
            }}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#00356B] px-5 text-sm font-semibold text-white shadow-lg shadow-[#00356B]/20 hover:bg-[#002855]"
          >
            Launch CEID Co-Pilot
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function BentoCard({
  title,
  blurb,
  children,
  className,
  id,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.article
      id={id}
      variants={fadeUp}
      className={cn(
        "ceid-card ceid-card-hover space-y-3 p-4 md:p-5",
        className
      )}
    >
      <div>
        <h3 className="font-semibold tracking-[-0.02em] text-[#0F172A]">{title}</h3>
        <p className="mt-1 text-sm text-[#475569]">{blurb}</p>
      </div>
      {children}
    </motion.article>
  );
}

function PreviewPane({
  focus,
  cadMode,
  setCadMode,
  laserPower,
  setLaserPower,
  laserTone,
}: {
  focus: string;
  cadMode: "raw" | "grok";
  setCadMode: (m: "raw" | "grok") => void;
  laserPower: number;
  setLaserPower: (n: number) => void;
  laserTone: { label: string; tone: string };
}) {
  if (focus === "cad") {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setCadMode("raw")} className={cn("rounded-lg px-2 py-1 text-xs font-semibold", cadMode === "raw" ? "bg-[#00356B] text-white" : "bg-[#F1F5F9]")}>Raw STL</button>
          <button type="button" onClick={() => setCadMode("grok")} className={cn("rounded-lg px-2 py-1 text-xs font-semibold", cadMode === "grok" ? "bg-[#00356B] text-white" : "bg-[#F1F5F9]")}>Grok +4× M4</button>
        </div>
        <div className="grid h-24 place-items-center rounded-xl bg-[#0B1120] text-xs text-white/80">
          {cadMode === "raw" ? "Reference plate" : "Parametric plate with mounting holes"}
        </div>
      </div>
    );
  }
  if (focus === "sandbox") {
    return (
      <div>
        <p className="ceid-mono text-xs text-[#475569]">Laser Power {laserPower}%</p>
        <input type="range" min={20} max={95} value={laserPower} onChange={(e) => setLaserPower(Number(e.target.value))} className="ceid-fader mt-2 w-full" />
        <p className={cn("mt-2 text-sm font-semibold", laserTone.tone)}>{laserTone.label}</p>
      </div>
    );
  }
  if (focus === "dfm") {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold">
        {["Sketch", "Becton Bin B4", "TouchNet Ready"].map((n, i) => (
          <span key={n} className="inline-flex items-center gap-1">
            <span className="rounded-full bg-[#E8F1FB] px-2 py-1 text-[#00356B]">{n}</span>
            {i < 2 && <ArrowRight className="h-3 w-3 text-[#94A3B8]" />}
          </span>
        ))}
      </div>
    );
  }
  if (focus === "certs") {
    return (
      <div className="space-y-2 text-xs">
        <p className="rounded-lg bg-[#F8FAFC] p-2 text-[#64748B]">raw workshop blast…</p>
        <p className="rounded-lg bg-[#E6F4EA] p-2 font-semibold text-[#137333]">.ics RSVP pass ready</p>
      </div>
    );
  }
  return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-[#0B1120]">
      <div className="absolute inset-6 rounded border border-dashed border-white/20" />
      <div className="ceid-scanline" />
      <span className="absolute bottom-3 left-3 rounded-full bg-[#E6F4EA] px-2 py-1 text-[11px] font-semibold text-[#137333]">
        Z-Offset Calibrated
      </span>
    </div>
  );
}
