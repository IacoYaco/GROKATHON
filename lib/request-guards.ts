import { NextResponse } from "next/server";

const MAX_BYTES: Record<string, number> = {
  diagnose: 1_500_000,
  dfm: 1_500_000,
  "parse-newsletter": 100_000,
  default: 256_000,
};

export async function readJsonLimited<T>(
  request: Request,
  routeKey: keyof typeof MAX_BYTES | "default" = "default"
): Promise<{ ok: true; body: T } | { ok: false; response: NextResponse }> {
  const max = MAX_BYTES[routeKey] ?? MAX_BYTES.default;
  const len = Number(request.headers.get("content-length") || "0");
  if (len > max) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Payload too large (max ${max} bytes)` },
        { status: 413 }
      ),
    };
  }

  const text = await request.text();
  if (text.length > max) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Payload too large (max ${max} bytes)` },
        { status: 413 }
      ),
    };
  }

  try {
    return { ok: true, body: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}
