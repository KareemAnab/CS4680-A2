// app/api/ics/route.ts
import { NextRequest } from "next/server";
import { planToICS } from "@/lib/ics";
import { PlanSchema } from "@/lib/schema";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = PlanSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.format() }), {
      status: 400,
    });
  }
  const ics = planToICS(parsed.data, "TimeCraft Plan");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=TimeCraft.ics",
    },
  });
}
