import { NextResponse } from "next/server";
import { resolveCeidSession } from "@/lib/auth-server";
import { mockDiagnosis } from "@/lib/mocks";
import { takeGrokRateLimit } from "@/lib/rate-limit";
import { readJsonLimited } from "@/lib/request-guards";
import {
  extractJsonObject,
  getXaiClient,
  GROK_VISION_MODEL,
  hasLiveXai,
} from "@/lib/xai";
import type { ApiEnvelope, DiagnosisResult } from "@/types/ceid";

interface DiagnoseBody {
  imageBase64?: string;
  mimeType?: string;
  machineId?: string;
  note?: string;
}

export async function POST(request: Request) {
  try {
    const session = await resolveCeidSession(request);
    if (!session.permissions.canDiagnose || !session.cursorSub) {
      return NextResponse.json(
        { error: "Link a Yale ID account to use Snap-to-Diagnose" },
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

    const parsed = await readJsonLimited<DiagnoseBody>(request, "diagnose");
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    if (!body.imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    if (!hasLiveXai()) {
      const payload: ApiEnvelope<DiagnosisResult> = {
        mode: "fallback",
        data: mockDiagnosis(body.machineId),
      };
      return NextResponse.json(payload);
    }

    const client = getXaiClient();
    if (!client) {
      const payload: ApiEnvelope<DiagnosisResult> = {
        mode: "fallback",
        data: mockDiagnosis(body.machineId),
      };
      return NextResponse.json(payload);
    }

    const mime = body.mimeType || "image/jpeg";
    const dataUrl = body.imageBase64.startsWith("data:")
      ? body.imageBase64
      : `data:${mime};base64,${body.imageBase64}`;

    const completion = await client.chat.completions.create({
      model: GROK_VISION_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are CEID Co-Pilot, a fabrication diagnostician for the Yale Center for Engineering Innovation and Design.
Analyze the provided photo of a failed print, laser cut, or shop machine issue.
Respond with ONLY valid JSON matching:
{
  "hardware": string,
  "failureMode": string,
  "rootCause": string,
  "fixChecklist": string[],
  "suggestedStatus": "free" | "in_use" | "issue" | "offline"
}
Be specific about temperatures, speeds, and materials when relevant.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Machine ID: ${body.machineId || "unknown"}\nOperator note: ${body.note || "none"}`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    const parsedJson = extractJsonObject(text) as DiagnosisResult;
    const data: DiagnosisResult = {
      machineId: body.machineId,
      hardware: parsedJson.hardware,
      failureMode: parsedJson.failureMode,
      rootCause: parsedJson.rootCause,
      fixChecklist: Array.isArray(parsedJson.fixChecklist)
        ? parsedJson.fixChecklist
        : [],
      suggestedStatus: parsedJson.suggestedStatus || "issue",
    };

    const payload: ApiEnvelope<DiagnosisResult> = { mode: "live", data };
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Diagnosis failed";
    const payload: ApiEnvelope<DiagnosisResult> = {
      mode: "fallback",
      data: mockDiagnosis(),
      error: message,
    };
    return NextResponse.json(payload);
  }
}
