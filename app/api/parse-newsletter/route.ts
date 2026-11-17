import { NextResponse } from "next/server";
import { resolveCeidSession } from "@/lib/auth-server";
import { mockWorkshops } from "@/lib/mocks";
import { readJsonLimited } from "@/lib/request-guards";
import {
  extractJsonObject,
  getXaiClient,
  GROK_TEXT_MODEL,
  hasLiveXai,
} from "@/lib/xai";
import type { ApiEnvelope, Workshop } from "@/types/ceid";

interface ParseBody {
  emailText?: string;
}

export async function POST(request: Request) {
  try {
    const session = await resolveCeidSession(request);
    if (!session.permissions.canParseNewsletter) {
      return NextResponse.json(
        { error: "Link a Yale ID account to use Cert Sniper" },
        { status: 403 }
      );
    }

    const parsed = await readJsonLimited<ParseBody>(
      request,
      "parse-newsletter"
    );
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    if (!body.emailText?.trim()) {
      return NextResponse.json(
        { error: "emailText is required" },
        { status: 400 }
      );
    }

    if (!hasLiveXai()) {
      const payload: ApiEnvelope<Workshop[]> = {
        mode: "fallback",
        data: mockWorkshops(),
      };
      return NextResponse.json(payload);
    }

    const client = getXaiClient();
    if (!client) {
      const payload: ApiEnvelope<Workshop[]> = {
        mode: "fallback",
        data: mockWorkshops(),
      };
      return NextResponse.json(payload);
    }

    const completion = await client.chat.completions.create({
      model: GROK_TEXT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You extract CEID workshop/training events from messy newsletter email text.
Respond with ONLY valid JSON:
{
  "workshops": [
    {
      "id": string,
      "title": string,
      "grantsCert": "laser_cutter"|"3d_printing"|"woodshop"|"metal_shop"|null,
      "grantsLabel": string,
      "startsAt": string (ISO 8601),
      "endsAt": string (ISO 8601),
      "location": string,
      "seatsAvailable": number,
      "seatsTotal": number,
      "prerequisites": string[]
    }
  ]
}
Ignore open-hours announcements that are not trainings unless they are clearly bookable workshops.
If year is missing, assume the next upcoming occurrence from today.`,
        },
        { role: "user", content: body.emailText },
      ],
    });

    const text = completion.choices[0]?.message?.content || "";
    const parsedJson = extractJsonObject(text) as { workshops?: Workshop[] };
    const data = Array.isArray(parsedJson.workshops)
      ? parsedJson.workshops
      : mockWorkshops();

    const payload: ApiEnvelope<Workshop[]> = { mode: "live", data };
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Parse failed";
    const payload: ApiEnvelope<Workshop[]> = {
      mode: "fallback",
      data: mockWorkshops(),
      error: message,
    };
    return NextResponse.json(payload);
  }
}
