import { NextRequest, NextResponse } from "next/server";
import { PlanSchema, RefineRequestSchema, type Plan } from "@/lib/schema";
import { generateJsonFromGemini } from "@/lib/gemini";

const refineSystem = `You refine an existing time-block plan.
Apply the user's change requests without violating anchors or availability.
Keep prior decisions when possible. Return ONLY JSON with the same schema {summary, unplaced_tasks?, events[]}.`;

// --- helper: append Z if missing ---
const withZ = (s: string) =>
  typeof s === "string" && !s.endsWith("Z") ? s + "Z" : s;
function normalizePlanDates(plan: any): any {
  if (!plan?.events) return plan;
  return {
    ...plan,
    events: plan.events.map((e: any) => ({
      ...e,
      start_iso: withZ(e.start_iso),
      end_iso: withZ(e.end_iso),
    })),
  };
}

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // normalize BEFORE validating so older plans pass
    const raw = await req.json();
    if (raw?.previousPlan)
      raw.previousPlan = normalizePlanDates(raw.previousPlan);

    const parsed = RefineRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { previousPlan, instruction, hardConstraints } = parsed.data;

    try {
      const userPayload = JSON.stringify({
        previousPlan,
        instruction,
        hardConstraints,
      });

      const text = await generateJsonFromGemini({
        system: refineSystem,
        userPayload,
      });

      const candidate = JSON.parse(text);
      const valid = PlanSchema.safeParse(candidate);
      if (!valid.success) throw new Error("Gemini returned invalid JSON");
      return NextResponse.json(valid.data satisfies Plan);
    } catch (err: any) {
      console.error("Gemini refine error:", err?.message || err);
      const fallback: Plan = {
        ...previousPlan,
        summary: `${previousPlan.summary} • Local refine note: ${instruction} (Gemini unavailable)`,
      };
      return NextResponse.json(fallback);
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
