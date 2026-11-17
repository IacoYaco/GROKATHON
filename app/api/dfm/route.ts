import { NextResponse } from "next/server";
import { mockDfmPlan } from "@/lib/mocks";
import {
  extractJsonObject,
  getXaiClient,
  GROK_TEXT_MODEL,
  GROK_VISION_MODEL,
  hasLiveXai,
} from "@/lib/xai";
import type { ApiEnvelope, CertId, DfmPlan } from "@/types/ceid";

interface DfmBody {
  projectDescription?: string;
  materials?: string;
  certifications?: { id: CertId; label: string; unlocked: boolean }[];
  imageBase64?: string;
  mimeType?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DfmBody;
    if (!body.projectDescription?.trim()) {
      return NextResponse.json(
        { error: "projectDescription is required" },
        { status: 400 }
      );
    }

    if (!hasLiveXai()) {
      const payload: ApiEnvelope<DfmPlan> = {
        mode: "fallback",
        data: mockDfmPlan(),
      };
      return NextResponse.json(payload);
    }

    const client = getXaiClient();
    if (!client) {
      const payload: ApiEnvelope<DfmPlan> = {
        mode: "fallback",
        data: mockDfmPlan(),
      };
      return NextResponse.json(payload);
    }

    const certSummary = (body.certifications || [])
      .map((c) => `${c.label}: ${c.unlocked ? "UNLOCKED" : "LOCKED"}`)
      .join("; ");

    const system = `You are CEID Co-Pilot, an agentic Design-for-Manufacturing router for Yale's CEID (Becton Center).
Plan fabrication using realistic CEID stations: Prusa MK4, Bambu Lab X1C, Epilog laser cutters, woodshop, metal shop, study rooms.
Respond with ONLY valid JSON:
{
  "summary": string,
  "sequence": [{ "order": number, "station": string, "action": string, "material"?: string, "requiredCert"?: "laser_cutter"|"3d_printing"|"woodshop"|"metal_shop" }],
  "traps": [{ "title": string, "detail": string, "severity": "info"|"warning"|"critical" }],
  "materials": [{ "material": string, "location": string, "notes"?: string }],
  "requiredCerts": ("laser_cutter"|"3d_printing"|"woodshop"|"metal_shop")[]
}
Material locations should sound like Becton Center stock (Sheet Rack B, North Wall, filament dry-box, etc.).`;

    const userText = `Project:\n${body.projectDescription}\n\nTarget materials: ${body.materials || "use CEID stock judgment"}\nStudent certifications: ${certSummary || "unknown"}`;

    const hasImage = Boolean(body.imageBase64);
    const mime = body.mimeType || "image/jpeg";
    const dataUrl =
      body.imageBase64 &&
      (body.imageBase64.startsWith("data:")
        ? body.imageBase64
        : `data:${mime};base64,${body.imageBase64}`);

    const completion = await client.chat.completions.create({
      model: hasImage ? GROK_VISION_MODEL : GROK_TEXT_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        hasImage && dataUrl
          ? {
              role: "user",
              content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            }
          : { role: "user", content: userText },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    const parsed = extractJsonObject(text) as DfmPlan;
    const data: DfmPlan = {
      summary: parsed.summary,
      sequence: Array.isArray(parsed.sequence) ? parsed.sequence : [],
      traps: Array.isArray(parsed.traps) ? parsed.traps : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      requiredCerts: Array.isArray(parsed.requiredCerts)
        ? parsed.requiredCerts
        : [],
    };

    const payload: ApiEnvelope<DfmPlan> = { mode: "live", data };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "DFM failed";
    const payload: ApiEnvelope<DfmPlan> = {
      mode: "fallback",
      data: mockDfmPlan(),
      error: message,
    };
    return NextResponse.json(payload);
  }
}
