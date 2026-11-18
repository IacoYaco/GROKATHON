"use client";

import {
  Box,
  Download,
  Eye,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { CadViewport } from "@/components/cad/CadViewport";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCeidStore } from "@/hooks/useCeidStore";
import { buildCadMesh, estimatePrintStats } from "@/lib/cad-geometry";
import type { ApiEnvelope, CadRecipe } from "@/types/ceid";

interface Bounds {
  width: number;
  depth: number;
  height: number;
}

const PRESETS: {
  id: string;
  name: string;
  bounds: Bounds;
  promptHint: string;
}[] = [
  {
    id: "motor-mount",
    name: "FTC/Drone Motor Mount Plate",
    bounds: { width: 60, depth: 60, height: 4 },
    promptHint:
      "Increase thickness to 5mm, widen to 80mm, add 4x M4 corner mounting holes, and cut a 22mm center hole for wires",
  },
  {
    id: "arduino-case",
    name: "Arduino Uno Snap Enclosure",
    bounds: { width: 75, depth: 58, height: 25 },
    promptHint:
      "Keep outer shell, 2mm walls, add USB cutout on the short side and four M3 standoff bosses",
  },
  {
    id: "l-bracket",
    name: "Custom L-Bracket Gusset",
    bounds: { width: 50, depth: 40, height: 30 },
    promptHint:
      "Thicken to 5mm, add two M5 slots on each flange, round outer corners 4mm",
  },
];

const CHIPS = [
  "Increase thickness to 5mm",
  "Add 4× M4 corner holes",
  "Cut 22mm center wire hole",
  "Widen to 80mm",
];

function downloadStl(recipe: CadRecipe) {
  const mesh = buildCadMesh(recipe);
  const exporter = new STLExporter();
  const result = exporter.parse(mesh, { binary: true });
  const blob =
    result instanceof DataView
      ? new Blob([result], { type: "application/octet-stream" })
      : new Blob([result], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${recipe.partName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "ceid-part"}.stl`;
  a.click();
  URL.revokeObjectURL(url);
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

export function CadStudio() {
  const { setApiMode, consumePendingIntent } = useCeidStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [partName, setPartName] = useState(PRESETS[0].name);
  const [bounds, setBounds] = useState<Bounds>(PRESETS[0].bounds);
  const [prompt, setPrompt] = useState(PRESETS[0].promptHint);
  const [referenceBuffer, setReferenceBuffer] = useState<ArrayBuffer | null>(
    null
  );
  const [showGhost, setShowGhost] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<CadRecipe | null>(null);

  const stats = useMemo(
    () => (recipe ? estimatePrintStats(recipe) : null),
    [recipe]
  );

  const onFile = async (file: File | null) => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const loader = new STLLoader();
    const geo = loader.parse(buf);
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (bb) {
      setBounds({
        width: Math.max(1, +(bb.max.x - bb.min.x).toFixed(2)),
        depth: Math.max(1, +(bb.max.y - bb.min.y).toFixed(2)),
        height: Math.max(0.5, +(bb.max.z - bb.min.z).toFixed(2)),
      });
    }
    setPartName(file.name.replace(/\.stl$/i, "") || "Uploaded reference");
    setReferenceBuffer(buf);
    setShowGhost(true);
  };

  const loadPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPartName(preset.name);
    setBounds(preset.bounds);
    setPrompt(preset.promptHint);
    setReferenceBuffer(null);
    setRecipe(null);
  };

  useEffect(() => {
    const intent = consumePendingIntent();
    if (!intent) return;
    const preset = PRESETS.find((p) =>
      intent.toLowerCase().includes(p.name.split(" ")[0]!.toLowerCase())
    );
    if (preset) loadPreset(preset.id);
    setPrompt(intent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumePendingIntent]);

  const runModify = async () => {
    if (!prompt.trim()) {
      setError("Describe the changes you want first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cad-modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partName, boundingBox: bounds, prompt }),
      });
      const json = (await res.json()) as ApiEnvelope<CadRecipe> & {
        error?: string;
      };
      if (!res.ok && !json.data) throw new Error(json.error || "CAD failed");
      setApiMode(json.mode);
      setRecipe(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CAD modify failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ceid-display text-3xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-4xl">
          AI CAD Studio
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#475569] md:text-base">
          Upload a reference STL or pick a CEID starter part, describe changes
          in plain English, preview the geometry, and download a printable STL.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <section className="ceid-card space-y-4 p-4 md:p-5">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
              Reference & prompt
            </h2>
            <input
              ref={fileRef}
              type="file"
              accept=".stl"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#286DC0] bg-white px-4 text-sm font-semibold text-[#286DC0]"
            >
              <Upload className="h-4 w-4" />
              Drop / upload reference .STL
            </button>
            <p className="mt-2 text-xs text-[#6B7280]">
              Bounding box:{" "}
              <span className="font-semibold text-[#00356B]">
                {bounds.width} × {bounds.depth} × {bounds.height} mm
              </span>
              {referenceBuffer ? " · ghost loaded" : " · starter / no file"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
              Starter presets
            </p>
            <div className="mt-2 space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loadPreset(p.id)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-left text-sm font-medium text-[#00356B] hover:bg-[#F8F9FA]"
                >
                  <Box className="h-4 w-4 text-[#286DC0]" />
                  <span>
                    {p.name}
                    <span className="block text-xs font-normal text-[#6B7280]">
                      {p.bounds.width}×{p.bounds.depth}×{p.bounds.height} mm
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-[#374151]">
            Plain-English change request
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-[12px] border border-[#E5E7EB] px-3 py-3 text-sm"
              placeholder="Describe how to modify the reference part…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() =>
                  setPrompt((prev) =>
                    prev.includes(chip) ? prev : `${prev.trim()}, ${chip}`
                  )
                }
                className="min-h-10 rounded-full bg-[#E8F1FB] px-3 text-xs font-semibold text-[#00356B]"
              >
                {chip}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={runModify}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#00356B] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Grok drafting parametric recipe…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate modified CAD
              </>
            )}
          </button>
          {error && <p className="text-sm text-[#C5221F]">{error}</p>}
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#0B1120] p-3 md:p-4">
          <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWireframe((v) => !v)}
              className="pointer-events-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-[11px] font-semibold text-white backdrop-blur"
            >
              Wireframe {wireframe ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={() => setShowGhost((v) => !v)}
              className="pointer-events-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 text-[11px] font-semibold text-white backdrop-blur"
            >
              <Eye className="h-3.5 w-3.5" />
              Ghost {showGhost ? "on" : "off"}
            </button>
            <span className="ceid-mono inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-white/10 px-2.5 text-[11px] font-semibold text-[#93C5FD] backdrop-blur">
              {recipe
                ? `${recipe.width.toFixed(1)} × ${recipe.depth.toFixed(1)} × ${recipe.height.toFixed(1)} mm`
                : `${bounds.width} × ${bounds.depth} × ${bounds.height} mm`}
            </span>
          </div>

          <CadViewport
            recipe={recipe}
            referenceBuffer={referenceBuffer}
            showGhost={showGhost}
            wireframe={wireframe}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {recipe ? (
              <StatusPill status="free" label="Mesh ready" />
            ) : (
              <StatusPill status="issue" label="No generated mesh yet" />
            )}
            {stats && (
              <>
                <StatusPill
                  status="certified"
                  label={`~${stats.grams.toFixed(1)} g`}
                />
                <StatusPill
                  status="priority"
                  label={`~${stats.minutes} min`}
                />
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!recipe}
            onClick={() => recipe && downloadStl(recipe)}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#286DC0] px-4 text-sm font-semibold text-white disabled:bg-[#334155]"
          >
            <Download className="h-4 w-4" />
            Download .STL
          </button>

          {recipe && (
            <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/5 p-3 text-white">
              <p className="text-sm text-white/85">{recipe.summary}</p>
              <div>
                <p className="ceid-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93C5FD]">
                  Onshape / Fusion 360
                </p>
                <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-white/75">
                  {recipe.onshapeNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="ceid-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93C5FD]">
                  Printability & tolerances
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/75">
                  {recipe.printTips.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
