"use client";

import {
  BadgeCheck,
  Flame,
  Loader2,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCeidStore } from "@/hooks/useCeidStore";
import { cn } from "@/lib/utils";
import type { ApiEnvelope, SandboxScenario } from "@/types/ceid";

const SCENARIOS = [
  "Cut 3mm clear acrylic on the Epilog Laser without melting it",
  "First print on Prusa MK4 (PETG bracket)",
  "Measure press-fit tolerances with Digital Calipers",
  "Solder header pins onto an ESP32 without bridging",
];

function inTarget(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function laserQuality(
  values: Record<string, number>,
  scenario: SandboxScenario
): { label: string; tone: "free" | "issue" | "offline"; tip: string } {
  const power = values.power ?? 50;
  const speed = values.speed ?? 40;
  const energy = power / Math.max(speed, 1);
  if (energy > 2.2) {
    return {
      label: "Scorched / Charred",
      tone: "offline",
      tip: `Power ${power}% at ${speed}% speed → high melt/fire risk on ${scenario.materialLabel}. Increase speed or drop power.`,
    };
  }
  if (energy < 0.9) {
    return {
      label: "Incomplete Cut",
      tone: "issue",
      tip: "Not enough energy density — raise power slightly or slow the cut.",
    };
  }
  return {
    label: "Clean Edge",
    tone: "free",
    tip: "Energy density looks right for a clean acrylic kerf. Confirm focus next.",
  };
}

function printerQuality(
  values: Record<string, number>
): { label: string; tone: "free" | "issue" | "offline"; tip: string } {
  const nozzle = values.nozzle ?? 240;
  const bed = values.bed ?? 85;
  const speed = values.speed ?? 25;
  if (nozzle > 255 || bed > 95) {
    return {
      label: "Overcooked / Stuck sheet risk",
      tone: "offline",
      tip: "Too hot for PETG — drop nozzle/bed before you glue filament to the sheet.",
    };
  }
  if (speed > 35 || nozzle < 225) {
    return {
      label: "Weak first-layer adhesion",
      tone: "issue",
      tip: "Slow the first layer and keep nozzle in the PETG window.",
    };
  }
  return {
    label: "Stable extrusion preview",
    tone: "free",
    tip: "Nozzle, bed, and first-layer speed look CEID-safe for PETG.",
  };
}

export function ToolSandbox() {
  const { setApiMode, consumePendingIntent } = useCeidStore();
  const [prompt, setPrompt] = useState(SCENARIOS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<SandboxScenario | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!scenario) return;
    const next: Record<string, number> = {};
    for (const c of scenario.controls) next[c.id] = c.defaultValue;
    setValues(next);
    setVerified(false);
  }, [scenario]);

  const stepStatus = useMemo(() => {
    if (!scenario) return [];
    return scenario.steps.map((step) => {
      const control = scenario.controls.find((c) => c.id === step.controlId);
      const value = values[step.controlId];
      const ok =
        control != null &&
        value != null &&
        inTarget(value, control.targetMin, control.targetMax);
      return { ...step, ok };
    });
  }, [scenario, values]);

  const allDone = stepStatus.length > 0 && stepStatus.every((s) => s.ok);

  useEffect(() => {
    if (allDone) setVerified(true);
  }, [allDone]);

  const feedback = useMemo(() => {
    if (!scenario) return null;
    if (scenario.previewKind === "printer") return printerQuality(values);
    if (scenario.previewKind === "laser") return laserQuality(values, scenario);
    const off = stepStatus.filter((s) => !s.ok).length;
    if (off === 0) {
      return {
        label: "Within target bands",
        tone: "free" as const,
        tip: scenario.coaching,
      };
    }
    return {
      label: "Dial into the green bands",
      tone: "issue" as const,
      tip: scenario.coaching || "Match each control to its target range.",
    };
  }, [scenario, values, stepStatus]);

  const run = async (text: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tool-sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const json = (await res.json()) as ApiEnvelope<SandboxScenario> & {
        error?: string;
      };
      if (!res.ok && !json.data) throw new Error(json.error || "Sandbox failed");
      setApiMode(json.mode);
      setScenario(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sandbox failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const intent = consumePendingIntent();
    if (intent) {
      setPrompt(intent);
      void run(intent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumePendingIntent]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ceid-display text-3xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-4xl">
          Tool Sandbox
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#475569] md:text-base">
          Just-in-time CEID training — describe the job, practice on a virtual
          machine panel, and earn a sandbox-verified badge before floor
          check-off.
        </p>
      </div>

      <section className="ceid-card space-y-3 p-4 md:p-5">
        <label className="block text-sm font-medium text-[#374151]">
          What are you trying to make or which CEID tool do you need?
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 min-h-12 w-full rounded-[12px] border border-[#E5E7EB] px-3 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setPrompt(s);
                void run(s);
              }}
              className="min-h-11 rounded-full border border-[#E5E7EB] bg-white px-3 text-left text-xs font-semibold text-[#00356B] hover:bg-[#F8F9FA]"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => run(SCENARIOS[0])}
            className="inline-flex min-h-12 items-center justify-center rounded-[12px] border border-[#286DC0] bg-white px-4 text-sm font-semibold text-[#286DC0]"
          >
            Load Sample Sandbox
          </button>
          <button
            type="button"
            disabled={loading || !prompt.trim()}
            onClick={() => run(prompt)}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Grok building your workbench…
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4" />
                Spin up simulator
              </>
            )}
          </button>
        </div>
        {error && <p className="text-sm text-[#C5221F]">{error}</p>}
      </section>

      {scenario && (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="ceid-card space-y-4 p-4 md:p-5">
            <div>
              <h2 className="text-lg font-semibold text-[#00356B]">
                {scenario.toolName}
              </h2>
              <p className="text-sm text-[#286DC0]">{scenario.ceidLocation}</p>
              <p className="mt-1 text-sm text-[#6B7280]">
                Material: {scenario.materialLabel}
              </p>
            </div>

            {scenario.controls.map((control) => {
              const value = values[control.id] ?? control.defaultValue;
              const ok = inTarget(value, control.targetMin, control.targetMax);
              return (
                <div key={control.id}>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-[#00356B]">
                      {control.label}
                    </label>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        ok ? "text-[#137333]" : "text-[#B06000]"
                      )}
                    >
                      {value}
                      {control.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={value}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [control.id]: Number(e.target.value),
                      }))
                    }
                    className="ceid-fader mt-2 w-full"
                  />
                  <p className="ceid-mono mt-1 text-xs text-[#64748B]">
                    Target {control.targetMin}–{control.targetMax}
                    {control.unit}. {control.hint}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="ceid-card space-y-4 p-4 md:p-5">
            <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FA] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Live preview
              </p>
              {scenario.previewKind === "laser" && (
                <div className="mt-3 space-y-3">
                  <div className="relative h-28 overflow-hidden rounded-[10px] bg-[#1a1a1a]">
                    <div
                      className="absolute inset-y-6 left-0 right-0 bg-gradient-to-r from-cyan-200/20 via-red-400/80 to-transparent"
                      style={{
                        opacity: Math.min(
                          1,
                          (values.power || 50) / 100 + 0.2
                        ),
                        transform: `translateX(${((values.speed || 40) / 100) * 40}%)`,
                      }}
                    />
                    <div className="absolute bottom-3 left-3 right-3 h-8 rounded bg-[#9ca3af]/70" />
                  </div>
                </div>
              )}
              {scenario.previewKind === "printer" && (
                <div className="mt-3 h-28 rounded-[10px] border border-[#E5E7EB] bg-white p-3">
                  <div
                    className="mx-auto h-16 w-24 rounded-sm bg-[#286DC0]"
                    style={{
                      boxShadow: `0 ${(values.speed || 20) / 8}px 0 rgba(0,53,107,0.25)`,
                      opacity: Math.min(1, (values.nozzle || 240) / 260),
                    }}
                  />
                  <p className="mt-2 text-center text-xs text-[#6B7280]">
                    Nozzle extrusion / bed adhesion sketch
                  </p>
                </div>
              )}
              {(scenario.previewKind === "calipers" ||
                scenario.previewKind === "solder") && (
                <div className="mt-3 rounded-[10px] border border-[#E5E7EB] bg-white p-4 text-sm text-[#374151]">
                  Practice readout updates with your dials — keep every control
                  inside its green target band.
                </div>
              )}

              {feedback && (
                <div className="mt-3 flex flex-wrap items-start gap-2">
                  <StatusPill status={feedback.tone} label={feedback.label} />
                  <p className="text-sm text-[#374151]">{feedback.tip}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                <Flame className="h-4 w-4 text-[#C5221F]" />
                Safety
              </h3>
              <ul className="mt-2 space-y-2">
                {scenario.safetyRules.map((rule) => (
                  <li
                    key={rule}
                    className="flex gap-2 rounded-[12px] border border-[#FCE8E6] bg-[#FCE8E6]/50 px-3 py-2 text-sm text-[#7A1F1C]"
                  >
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                Hands-on checklist
              </h3>
              <ul className="mt-2 space-y-2">
                {stepStatus.map((step) => (
                  <li
                    key={step.id}
                    className={cn(
                      "flex min-h-11 items-start gap-2 rounded-[12px] border px-3 py-2 text-sm",
                      step.ok
                        ? "border-[#E6F4EA] bg-[#E6F4EA]/60 text-[#137333]"
                        : "border-[#E5E7EB] bg-white text-[#374151]"
                    )}
                  >
                    <span className="font-bold">{step.ok ? "✓" : "○"}</span>
                    {step.instruction}
                  </li>
                ))}
              </ul>
            </div>

            {verified && (
              <div className="flex items-center gap-2 rounded-[12px] border border-[#E6F4EA] bg-[#E6F4EA] px-3 py-3 text-sm font-semibold text-[#137333]">
                <BadgeCheck className="h-5 w-5" />
                Sandbox Verified — Ready for Floor Check-off
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
