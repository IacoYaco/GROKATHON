"use client";

import {
  AlertTriangle,
  ArrowRight,
  ImagePlus,
  Loader2,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCeidStore } from "@/hooks/useCeidStore";
import { SAMPLE_DFM_PROJECT } from "@/lib/sample-data";
import type { ApiEnvelope, CertId, DfmPlan } from "@/types/ceid";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const CERT_LABEL: Record<CertId, string> = {
  laser_cutter: "Laser Cutter",
  "3d_printing": "3D Printing",
  woodshop: "Woodshop",
  metal_shop: "Metal Shop",
};

export function DfmPanel() {
  const {
    certs,
    setApiMode,
    setDfmRequiredCerts,
    jumpToCertSniper,
  } = useCeidStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState(
    "Delrin, birch plywood, PETG, hardware from CEID bins"
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<DfmPlan | null>(null);

  const lockedRequired =
    plan?.requiredCerts.filter(
      (id) => !certs.find((c) => c.id === id)?.unlocked
    ) || [];

  const runDfm = async () => {
    if (!description.trim()) {
      setError("Add a project description first.");
      return;
    }
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/dfm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectDescription: description,
          materials,
          certifications: certs,
          imageBase64: imageBase64 || undefined,
        }),
      });
      const json = (await res.json()) as ApiEnvelope<DfmPlan> & {
        error?: string;
      };
      if (!res.ok && !json.data) {
        throw new Error(json.error || "DFM request failed");
      }
      setApiMode(json.mode);
      setPlan(json.data);
      setDfmRequiredCerts(json.data.requiredCerts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[#00356B] md:text-3xl">
          Agentic DFM Router
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6B7280] md:text-base">
          Describe the build. Grok routes it across CEID stations, flags DFM
          traps, and gates on your live safety certifications.
        </p>
      </div>

      <section className="ceid-card space-y-3 p-4 md:p-5">
        <label className="block text-sm font-medium text-[#374151]">
          Project description, constraints & dimensions
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder="What are you making? Constraints, materials, tolerances…"
            className="mt-1 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-3 text-sm"
          />
        </label>

        <label className="block text-sm font-medium text-[#374151]">
          Target materials
          <input
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-[12px] border border-[#E5E7EB] px-3 text-sm"
          />
        </label>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImageBase64(await fileToDataUrl(file));
          }}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#00356B]"
          >
            <ImagePlus className="h-4 w-4" />
            {imageBase64 ? "Sketch attached" : "Upload sketch / CAD screenshot"}
          </button>
          <button
            type="button"
            onClick={() => setDescription(SAMPLE_DFM_PROJECT)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] border border-[#286DC0] bg-white px-4 text-sm font-semibold text-[#286DC0]"
          >
            Load Sample Project: Autonomous Drone Frame
          </button>
          <button
            type="button"
            onClick={runDfm}
            disabled={loading}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white hover:bg-[#00284f] disabled:opacity-60 sm:flex-none sm:min-w-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Routing…
              </>
            ) : (
              "Generate DFM Plan"
            )}
          </button>
        </div>

        {error && <p className="text-sm text-[#C5221F]">{error}</p>}
      </section>

      {loading && (
        <section className="ceid-card space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#00356B]">
            <Loader2 className="h-5 w-5 animate-spin text-[#286DC0]" />
            Grok reasoning across CEID stations...
          </div>
          <div className="ceid-skeleton h-5 w-2/3" />
          <div className="ceid-skeleton h-24 w-full" />
          <div className="ceid-skeleton h-24 w-full" />
        </section>
      )}

      {plan && !loading && (
        <div className="space-y-4">
          {lockedRequired.length > 0 && (
            <div className="rounded-[12px] border border-[#F5C2C0] bg-[#FCE8E6] p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#C5221F]" />
                <div className="flex-1">
                  <p className="font-semibold text-[#C5221F]">
                    Certification gate — locked stations in your plan
                  </p>
                  <p className="mt-1 text-sm text-[#7A1F1C]">
                    You still need:{" "}
                    {lockedRequired.map((id) => CERT_LABEL[id]).join(", ")}.
                    Unlock via a training before those steps.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lockedRequired.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => jumpToCertSniper(id)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-[#B06000] px-3 text-sm font-semibold text-white"
                      >
                        Unlock via Cert Sniper →
                        <ArrowRight className="h-4 w-4" />
                        {CERT_LABEL[id]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <section className="ceid-card p-4 md:p-5">
            <h2 className="text-lg font-semibold text-[#00356B]">
              Recommended Fabrication Sequence
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">{plan.summary}</p>
            <ol className="mt-4 space-y-3">
              {plan.sequence.map((step) => (
                <li
                  key={step.order}
                  className="rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FA] p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#286DC0]">
                    Step {step.order}: {step.station}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#00356B]">
                    {step.action}
                  </p>
                  {step.material && (
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Material: {step.material}
                    </p>
                  )}
                  {step.requiredCert && (
                    <div className="mt-2">
                      <StatusPill
                        status={
                          certs.find((c) => c.id === step.requiredCert)
                            ?.unlocked
                            ? "certified"
                            : "locked"
                        }
                        label={`${CERT_LABEL[step.requiredCert]} ${
                          certs.find((c) => c.id === step.requiredCert)
                            ?.unlocked
                            ? "✓"
                            : "🔒"
                        }`}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section className="ceid-card p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#00356B]">
              <AlertTriangle className="h-5 w-5 text-[#B06000]" />
              DFM Trap Detector
            </h2>
            <ul className="mt-3 space-y-3">
              {plan.traps.map((trap, i) => (
                <li
                  key={i}
                  className="rounded-[12px] border border-[#E5E7EB] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#00356B]">{trap.title}</p>
                    <StatusPill
                      status={
                        trap.severity === "critical"
                          ? "offline"
                          : trap.severity === "warning"
                            ? "issue"
                            : "free"
                      }
                      label={trap.severity}
                    />
                  </div>
                  <p className="mt-1 text-sm text-[#4B5563]">{trap.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="ceid-card p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#00356B]">
              <MapPin className="h-5 w-5 text-[#286DC0]" />
              CEID Material & Bin Locator
            </h2>
            <ul className="mt-3 space-y-3">
              {plan.materials.map((m, i) => (
                <li
                  key={i}
                  className="rounded-[12px] border border-[#E5E7EB] bg-[#F8F9FA] p-3"
                >
                  <p className="font-semibold text-[#00356B]">{m.material}</p>
                  <p className="mt-1 text-sm text-[#286DC0]">{m.location}</p>
                  {m.notes && (
                    <p className="mt-1 text-xs text-[#6B7280]">{m.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
