import OpenAI from "openai";

export const GROK_VISION_MODEL =
  process.env.GROK_VISION_MODEL || "grok-2-vision-1212";
export const GROK_TEXT_MODEL =
  process.env.GROK_TEXT_MODEL || "grok-3-latest";

export function hasLiveXai(): boolean {
  return Boolean(process.env.XAI_API_KEY && process.env.XAI_API_KEY.trim());
}

export function getXaiClient(): OpenAI | null {
  if (!hasLiveXai()) return null;
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
  });
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model response was not valid JSON");
  }
}
