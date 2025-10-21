import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.GOOGLE_API_KEY || "";
if (!key) console.error("❌ GOOGLE_API_KEY missing");

export const genAI = new GoogleGenerativeAI(key);

const CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-1.5-flash-8b-latest",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
].filter(Boolean) as string[];

function sanitizeToJsonObject(text: string): string {
  // If it's already valid JSON, return as-is
  try {
    JSON.parse(text);
    return text;
  } catch {}

  // Try to extract the first {...} JSON object
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const sliced = text.slice(start, end + 1);
    // quick brackets balance check
    let depth = 0;
    for (const ch of sliced) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      if (depth < 0) return text; // give up
    }
    try {
      JSON.parse(sliced);
      return sliced;
    } catch {} // fall through
  }
  return text;
}

async function call(model: string, prompt: string) {
  const m = genAI.getGenerativeModel({ model });
  const res = await m.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  let text = res.response.text() || "";
  text = sanitizeToJsonObject(text);
  // Validate once more; throw if still invalid so route uses fallback
  JSON.parse(text);
  return text;
}

export async function generateJsonFromGemini({
  system,
  fewShotPairs,
  userPayload,
}: {
  system: string;
  fewShotPairs?: { user: string; assistant: string }[];
  userPayload: string;
}) {
  const parts: string[] = [];
  if (fewShotPairs?.length) {
    for (const p of fewShotPairs) {
      parts.push("User:\n" + p.user.trim());
      parts.push("Assistant (JSON):\n" + p.assistant.trim());
    }
  }
  parts.push("User:\n" + userPayload.trim());
  parts.push(
    "Assistant: Return ONLY a single JSON object with the exact schema. No code fences or explanations."
  );
  const prompt = `${system}\n\n${parts.join("\n\n")}`;

  let lastErr: any;
  for (const model of CANDIDATES) {
    try {
      const text = await call(model, prompt);
      console.log("Gemini model used:", model);
      return text;
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      if (msg.includes("Not Found") || msg.includes("unsupported")) {
        console.warn("Model failed, trying next:", model);
        continue;
      }
      console.warn("Gemini returned invalid JSON; falling back. Reason:", msg);
      throw e;
    }
  }
  throw lastErr;
}
