import { NextResponse } from "next/server";
import { resolveCeidSession } from "@/lib/auth-server";
import { mockCadRecipe } from "@/lib/mocks";
import { takeGrokRateLimit } from "@/lib/rate-limit";
import { readJsonLimited } from "@/lib/request-guards";
import {
  extractJsonObject,
  getXaiClient,
  GROK_TEXT_MODEL,
  hasLiveXai,
} from "@/lib/xai";
import type { ApiEnvelope, CadRecipe } from "@/types/ceid";

interface CadBody {
  partName?: string;
  boundingBox?: { width: number; depth: number; height: number };
  prompt?: string;
}

export async function POST(request: Request) {
  try {
    const session = await resolveCeidSession(request);
    if (!session.permissions.canUseCadStudio || !session.cursorSub) {
      return NextResponse.json(
        { error: "Link a Yale ID account to use AI CAD Studio" },
        { status: 403 }
      );
    }
    const limited = takeGrokRateLimit(session.cursorSub);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many Grok requests. Try again shortly." },
        {
          status: 429,
          headers: { "retry-after": String(limited.retryAfterSec) },
        }
      );
    }

    const parsed = await readJsonLimited<CadBody>(request, "default");
    if (!parsed.ok) return parsed.response;
    const prompt = parsed.body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    if (!hasLiveXai()) {
      return NextResponse.json({
        mode: "fallback",
        data: mockCadRecipe(prompt),
      } satisfies ApiEnvelope<CadRecipe>);
    }

    const client = getXaiClient();
    if (!client) {
      return NextResponse.json({
        mode: "fallback",
        data: mockCadRecipe(prompt),
      } satisfies ApiEnvelope<CadRecipe>);
    }

    const box = parsed.body.boundingBox || {
      width: 60,
      depth: 60,
      height: 4,
    };

    const completion = await client.chat.completions.create({
      model: GROK_TEXT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are CEID Co-Pilot CAD assistant for Yale makers who are new to CAD.
Translate natural-language edits on a reference STL into a parametric plate/enclosure recipe.
Coordinates: origin at part center, X along width, Y along depth, Z up. Units: millimeters.
Respond with ONLY valid JSON:
{
  "partName": string,
  "width": number,
  "depth": number,
  "height": number,
  "cornerRadius": number,
  "wallThickness": number|null,
  "holes": [{"x":number,"y":number,"diameter":number,"label":string}],
  "features": [{"x":number,"y":number,"width":number,"depth":number,"height":number,"label":string}],
  "onshapeNotes": string[],
  "printTips": string[],
  "summary": string
}
Add FDM clearance to fastener holes when relevant. Keep geometry printable on Prusa/Bambu.`,
        },
        {
          role: "user",
          content: `Reference part: ${parsed.body.partName || "Untitled"}
Bounding box mm: ${box.width} × ${box.depth} × ${box.height}
Requested changes: ${prompt}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    const raw = extractJsonObject(text) as CadRecipe;
    const data: CadRecipe = {
      partName: raw.partName || "Modified part",
      width: Number(raw.width) || box.width,
      depth: Number(raw.depth) || box.depth,
      height: Number(raw.height) || box.height,
      cornerRadius: Number(raw.cornerRadius) || 0,
      wallThickness:
        raw.wallThickness == null ? null : Number(raw.wallThickness),
      holes: Array.isArray(raw.holes) ? raw.holes : [],
      features: Array.isArray(raw.features) ? raw.features : [],
      onshapeNotes: Array.isArray(raw.onshapeNotes) ? raw.onshapeNotes : [],
      printTips: Array.isArray(raw.printTips) ? raw.printTips : [],
      summary: raw.summary || "Parametric recipe generated.",
    };

    return NextResponse.json({
      mode: "live",
      data,
    } satisfies ApiEnvelope<CadRecipe>);
  } catch (error) {
    const message = error instanceof Error ? error.message : "CAD modify failed";
    return NextResponse.json({
      mode: "fallback",
      data: mockCadRecipe(),
      error: message,
    } satisfies ApiEnvelope<CadRecipe>);
  }
}
