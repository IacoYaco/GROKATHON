import { NextResponse } from "next/server";
import { resolveCeidSession } from "@/lib/auth-server";
import { mockSandboxScenario } from "@/lib/mocks";
import { takeGrokRateLimit } from "@/lib/rate-limit";
import { readJsonLimited } from "@/lib/request-guards";
import {
  extractJsonObject,
  getXaiClient,
  GROK_TEXT_MODEL,
  hasLiveXai,
} from "@/lib/xai";
import type { ApiEnvelope, SandboxScenario } from "@/types/ceid";

interface SandboxBody {
  prompt?: string;
}

export async function POST(request: Request) {
  try {
    const session = await resolveCeidSession(request);
    if (!session.permissions.canUseToolSandbox || !session.cursorSub) {
      return NextResponse.json(
        { error: "Link a Yale ID account to use Tool Sandbox" },
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

    const parsed = await readJsonLimited<SandboxBody>(request, "default");
    if (!parsed.ok) return parsed.response;
    const prompt = parsed.body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    if (!hasLiveXai()) {
      return NextResponse.json({
        mode: "fallback",
        data: mockSandboxScenario(prompt),
      } satisfies ApiEnvelope<SandboxScenario>);
    }

    const client = getXaiClient();
    if (!client) {
      return NextResponse.json({
        mode: "fallback",
        data: mockSandboxScenario(prompt),
      } satisfies ApiEnvelope<SandboxScenario>);
    }

    const completion = await client.chat.completions.create({
      model: GROK_TEXT_MODEL,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `You are CEID Co-Pilot Tool Sandbox for Yale CEID (Becton Center).
Build a just-in-time interactive training panel for the user's shop problem.
Respond with ONLY valid JSON:
{
  "toolName": string,
  "ceidLocation": string,
  "previewKind": "laser"|"printer"|"calipers"|"solder",
  "materialLabel": string,
  "controls": [{"id":string,"label":string,"unit":string,"min":number,"max":number,"step":number,"defaultValue":number,"targetMin":number,"targetMax":number,"hint":string}],
  "steps": [{"id":string,"instruction":string,"controlId":string}],
  "safetyRules": string[],
  "coaching": string
}
Use 3–4 controls and matching steps. Targets must be reachable within min/max.
Include CEID-realistic safety (e.g. never cut PVC on laser).`,
        },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    const raw = extractJsonObject(text) as SandboxScenario;
    const data: SandboxScenario = {
      toolName: raw.toolName || "CEID tool",
      ceidLocation: raw.ceidLocation || "Becton Center",
      previewKind: raw.previewKind || "laser",
      materialLabel: raw.materialLabel || "Stock material",
      controls: Array.isArray(raw.controls) ? raw.controls : [],
      steps: Array.isArray(raw.steps) ? raw.steps : [],
      safetyRules: Array.isArray(raw.safetyRules) ? raw.safetyRules : [],
      coaching: raw.coaching || "",
    };

    return NextResponse.json({
      mode: "live",
      data,
    } satisfies ApiEnvelope<SandboxScenario>);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sandbox generation failed";
    return NextResponse.json({
      mode: "fallback",
      data: mockSandboxScenario(),
      error: message,
    } satisfies ApiEnvelope<SandboxScenario>);
  }
}
