import { NextResponse } from "next/server";
import { mockDiagnosis } from "@/lib/mocks";
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
    const body = (await request.json()) as DiagnoseBody;
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
    const parsed = extractJsonObject(text) as DiagnosisResult;
    const data: DiagnosisResult = {
      machineId: body.machineId,
      hardware: parsed.hardware,
      failureMode: parsed.failureMode,
      rootCause: parsed.rootCause,
      fixChecklist: Array.isArray(parsed.fixChecklist)
        ? parsed.fixChecklist
        : [],
      suggestedStatus: parsed.suggestedStatus || "issue",
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
