"use client";

import { Camera, Copy, ImagePlus, Loader2, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCeidStore } from "@/hooks/useCeidStore";
import { MACHINE_OPTIONS, getSampleFailedPrintDataUrl } from "@/lib/sample-data";
import type { ApiEnvelope, DiagnosisResult } from "@/types/ceid";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SnapToDiagnose() {
  const { setApiMode, updateMachineStatus, consumePendingIntent } =
    useCeidStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [machineId, setMachineId] = useState(MACHINE_OPTIONS[0]?.id || "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    const intent = consumePendingIntent();
    if (intent) setNote(intent);
  }, [consumePendingIntent]);

  const runDiagnose = async (imageBase64: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          machineId: machineId || undefined,
          note: note || undefined,
        }),
      });
      const json = (await res.json()) as ApiEnvelope<DiagnosisResult> & {
        error?: string;
      };
      if (!res.ok && !json.data) {
        throw new Error(json.error || "Diagnosis request failed");
      }
      setApiMode(json.mode);
      setResult(json.data);
      if (machineId) {
        updateMachineStatus(machineId, json.data.suggestedStatus || "issue", {
          verifiedViaGrok: true,
          note: `${json.data.failureMode} — ${json.data.rootCause.slice(0, 120)}`,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    await runDiagnose(dataUrl);
  };

  const loadSample = async () => {
    const dataUrl = getSampleFailedPrintDataUrl();
    setPreview(dataUrl);
    setMachineId("prusa-4");
    await runDiagnose(dataUrl);
  };

  return (
    <section className="ceid-card p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="ceid-display text-lg font-semibold tracking-[-0.03em] text-[#0F172A]">
            Snap-to-Diagnose
          </h2>
          <p className="mt-1 text-sm text-[#475569]">
            Camera capture or upload — Grok Vision returns failure mode, root
            cause, and a shop-floor fix checklist.
          </p>
        </div>
        <Wrench className="h-5 w-5 text-[#286DC0]" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#374151]">
            Tag machine (optional)
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-sm"
            >
              {MACHINE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-[#374151]">
            Note (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. PETG, 0.2mm, after nozzle crash"
              className="mt-1 min-h-11 w-full rounded-[12px] border border-[#E5E7EB] px-3 text-sm"
            />
          </label>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white hover:bg-[#00284f]"
            >
              <Camera className="h-4 w-4" />
              Snap or Upload Photo
            </button>
            <button
              type="button"
              onClick={loadSample}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#286DC0] bg-white px-4 text-sm font-semibold text-[#286DC0] hover:bg-[#F3F8FD]"
            >
              <ImagePlus className="h-4 w-4" />
              Load Sample Failed Print Photo
            </button>
          </div>

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Diagnosis preview"
              className="mt-1 max-h-56 w-full rounded-[12px] border border-[#E5E7EB] object-cover"
            />
          )}
        </div>

        <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FA] p-4">
          {loading && (
            <div className="relative flex h-full min-h-48 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#0B1120] text-center">
              <div className="ceid-scanline" />
              <Loader2 className="relative z-10 h-8 w-8 animate-spin text-[#93C5FD]" />
              <p className="relative z-10 text-sm font-medium text-white">
                Grok Vision inspecting layer lines…
              </p>
              <div className="relative z-10 w-full space-y-2 px-6">
                <div className="ceid-skeleton mx-auto h-4 w-3/4 opacity-40" />
                <div className="ceid-skeleton h-4 w-full opacity-40" />
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="space-y-3">
              <StatusPill status="offline" label="Diagnosis failed" />
              <p className="text-sm text-[#C5221F]">{error}</p>
              <button
                type="button"
                className="min-h-11 rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white"
                onClick={() => preview && runDiagnose(preview)}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && !result && (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Camera className="mb-2 h-8 w-8 text-[#9CA3AF]" />
              <p className="text-sm text-[#6B7280]">
                Diagnosis output appears here after you snap or load a sample.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status="issue" label={result.failureMode} />
                <span className="text-xs font-medium text-[#286DC0]">
                  Verified via Grok Vision
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-3">
                  <p className="ceid-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Failure Mode
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                    {result.failureMode}
                  </p>
                </div>
                <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-3">
                  <p className="ceid-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Hardware
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#00356B]">
                    {result.hardware}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-3">
                <p className="ceid-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Root Cause
                </p>
                <p className="mt-1 text-sm text-[#334155]">{result.rootCause}</p>
              </div>
              <div>
                <p className="mb-2 ceid-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Exact Fix Parameters
                </p>
                <ol className="space-y-2">
                  {result.fixChecklist.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-[rgba(15,23,42,0.08)] bg-white px-3 py-2 text-sm text-[#334155]"
                    >
                      <span className="ceid-mono font-semibold text-[#286DC0]">
                        {i + 1}.
                      </span>
                      <span className="flex-1">{step}</span>
                      <button
                        type="button"
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[#F1F5F9] px-2 text-[11px] font-semibold text-[#00356B]"
                        onClick={() => void navigator.clipboard?.writeText(step)}
                        title="Copy step"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
