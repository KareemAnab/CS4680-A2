import { NextRequest, NextResponse } from "next/server";
import {
  PlanSchema,
  ScheduleRequestSchema,
  type Plan,
  type ScheduleRequest,
} from "@/lib/schema";
import {
  systemPrompt,
  fewShotAssistant1,
  fewShotUser1,
  jsonInstruction,
} from "@/lib/prompt";
import { generateJsonFromGemini } from "@/lib/gemini";

function localPlan(payload: ScheduleRequest): Plan {
  // ----------------- utils -----------------
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  type DayName = (typeof DAY_NAMES)[number];

  const dayIdx = (d: string) => DAY_NAMES.indexOf(d as DayName);

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  // Monday 00:00 local — used to mint ISO strings with trailing Z
  const baseMonday = (() => {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // Mon=0
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - day,
      0,
      0,
      0,
      0
    );
  })();

  const toISO = (dow: number, minutes: number) => {
    const d = new Date(baseMonday);
    d.setDate(d.getDate() + dow);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(minutes);
    // normalize to Z so your UI gets ISO with Z
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  };

  const makeId = (prefix: string, dow: number, s: number, e: number) =>
    `${prefix}-${dow}-${s}-${e}-${Math.random().toString(36).slice(2, 8)}`;

  type Block = {
    start: number;
    end: number;
    title: string;
    kind: "TASK" | "ANCHOR";
  };

  // ----------------- preferences (tolerant reads) -----------------
  const prefAny = (payload.preferences as any) || {};

  const focus: number =
    payload.preferences?.focus_block_min ?? prefAny.focus_block_min ?? 60;

  const brk: number = payload.preferences?.break_min ?? prefAny.break_min ?? 10;

  const earliest: number = payload.preferences?.earliest_start
    ? toMin(payload.preferences.earliest_start)
    : prefAny.earliest_start
    ? toMin(prefAny.earliest_start)
    : 9 * 60;

  const latest: number = payload.preferences?.latest_end
    ? toMin(payload.preferences.latest_end)
    : prefAny.latest_end
    ? toMin(prefAny.latest_end)
    : 20 * 60;

  // NEW knobs (may not exist in your schema yet; read via any)
  const minGap: number = prefAny.min_gap_min ?? 45; // minutes between blocks
  const maxPerDay: number = prefAny.max_blocks_per_day ?? 3; // task blocks/day
  const preferSpread: boolean = (prefAny.prefer_spread ?? true) as boolean;

  // Optional caps sometimes present in your schema (ignore if missing)
  const maxDailyFocusMin: number | undefined = prefAny.max_daily_focus_min;

  // ----------------- day model -----------------
  type DayState = {
    busy: Block[];
    windows: [number, number][];
    placedTasks: number;
  };
  const byDay: Record<number, DayState> = {};

  // Availability windows (clamped by earliest/latest)
  for (const a of payload.availability ?? []) {
    const di = dayIdx(a.day);
    if (di < 0) continue;
    const ws = Math.max(earliest, toMin(a.start));
    const we = Math.min(latest, toMin(a.end));
    if (we > ws)
      (byDay[di] ??= { busy: [], windows: [], placedTasks: 0 }).windows.push([
        ws,
        we,
      ]);
  }

  // ----------------- output container (matches PlanSchema) -----------------
  const events: {
    id: string;
    title: string;
    day: DayName;
    start_iso: string;
    end_iso: string;
    type: "TASK" | "ANCHOR" | "BREAK";
    priority?: "P1" | "P2" | "P3";
  }[] = [];
  const unplaced_tasks: string[] = [];

  // ----------------- anchors -----------------
  for (const an of payload.anchors ?? []) {
    const di = dayIdx(an.day);
    if (di < 0) continue;
    const s = Math.max(earliest, toMin(an.start));
    const e = Math.min(latest, toMin(an.end));
    if (e <= s) continue;

    (byDay[di] ??= { busy: [], windows: [], placedTasks: 0 }).busy.push({
      start: s,
      end: e,
      title: an.title ?? "Anchor",
      kind: "ANCHOR",
    });

    events.push({
      id: makeId("anc", di, s, e),
      title: an.title ?? "New Anchor",
      day: DAY_NAMES[di],
      start_iso: toISO(di, s),
      end_iso: toISO(di, e),
      type: "ANCHOR",
    });
  }

  // Sort existing busy blocks (anchors) per day
  for (const d in byDay) byDay[d as any].busy.sort((a, b) => a.start - b.start);

  // ----------------- helpers -----------------
  const respectsGap = (day: DayState, s: number, e: number, gap: number) =>
    day.busy.every((b) => e + gap <= b.start || b.end + gap <= s);

  function freeIntervals(
    day: DayState,
    wS: number,
    wE: number
  ): [number, number][] {
    const out: [number, number][] = [];
    let cur = wS;
    for (const b of day.busy) {
      if (b.start >= wE) break;
      if (b.end <= cur) continue;
      if (b.start > cur) out.push([cur, Math.min(b.start, wE)]);
      cur = Math.max(cur, b.end);
    }
    if (cur < wE) out.push([cur, wE]);
    return out;
  }

  const slotScore = (day: DayState, startMin: number, okAdj: boolean) => {
    const adjacencyPenalty = okAdj ? 0 : 1000;
    const loadMin = day.busy.reduce((acc, b) => acc + (b.end - b.start), 0);
    const spreadTerm = preferSpread ? 2 * loadMin : 0;
    return 3 * adjacencyPenalty + spreadTerm + startMin / 60;
  };

  // ----------------- tasks → chunks -----------------
  type RawTask = {
    id?: string;
    title: string;
    minutes?: number;
    est_minutes?: number;
    duration?: number;
    priority?: "P1" | "P2" | "P3";
    notes?: string;
    hard_deadline?: string;
  };

  type Task = { title: string; minutes: number; priority?: "P1" | "P2" | "P3" };

  const rawTasks: RawTask[] = ((payload.tasks as any) ?? []) as RawTask[];

  const tasks: Task[] = rawTasks
    .map((t) => ({
      title: t.title,
      minutes: Number(
        (t as any).minutes ?? (t as any).est_minutes ?? (t as any).duration ?? 0
      ),
      priority: t.priority,
    }))
    .filter((t) => t.title && t.minutes > 0);

  const prioRank = (p?: string) =>
    p === "P1" ? 0 : p === "P2" ? 1 : p === "P3" ? 2 : 3;
  tasks.sort(
    (a, b) =>
      prioRank(a.priority) - prioRank(b.priority) ||
      a.title.localeCompare(b.title)
  );

  const chunks: Task[] = [];
  for (const t of tasks) {
    let left = t.minutes;
    while (left > 0) {
      const block = Math.min(focus, left);
      chunks.push({ title: t.title, minutes: block, priority: t.priority });
      left -= block;
      if (left > 0 && brk > 0) {
        // "Break" marker: not scheduled as a block; just for visual emit after placement
        chunks.push({ title: "Break", minutes: brk });
      }
    }
  }

  // ----------------- placement -----------------
  type DayStateExt = DayState & { focusTotal?: number };
  for (let d = 0; d < 7; d++) {
    const day = byDay[d];
    if (day)
      (day as DayStateExt).focusTotal = day.busy.reduce(
        (acc, b) => acc + (b.end - b.start),
        0
      );
  }

  const STEP = 10; // minutes step for candidate search

  for (const ch of chunks) {
    if (ch.title === "Break") {
      // visual break is emitted after a task placement; skip scheduling
      continue;
    }

    type Cand = { d: number; s: number; e: number; score: number };
    const cands: Cand[] = [];

    for (let d = 0; d < 7; d++) {
      const day = byDay[d];
      if (!day) continue;

      // daily block cap
      if (maxPerDay && day.placedTasks >= maxPerDay) continue;

      // optional: cap on total focused minutes per day (if your schema provided it)
      if (
        maxDailyFocusMin &&
        (day as DayStateExt).focusTotal! >= maxDailyFocusMin
      )
        continue;

      for (const [wS, wE] of day.windows) {
        for (const [fS, fE] of freeIntervals(day, wS, wE)) {
          for (let s = fS; s + ch.minutes <= fE; s += STEP) {
            const e = s + ch.minutes;
            const ok = respectsGap(day, s, e, minGap);
            if (!ok && preferSpread) continue;
            const score = slotScore(day, s, ok);
            cands.push({ d, s, e, score });
          }
        }
      }
    }

    if (!cands.length) {
      unplaced_tasks.push(ch.title);
      continue;
    }

    cands.sort((a, b) => a.score - b.score);
    const best = cands[0];
    const day = byDay[best.d] as DayStateExt;

    // place as a real busy block
    day.busy.push({
      start: best.s,
      end: best.e,
      title: ch.title,
      kind: "TASK",
    });
    day.busy.sort((a, b) => a.start - b.start);
    day.placedTasks += 1;
    day.focusTotal = (day.focusTotal ?? 0) + (best.e - best.s);

    const id = makeId("tsk", best.d, best.s, best.e);
    events.push({
      id,
      title: `${ch.title} (focus)`,
      day: DAY_NAMES[best.d],
      start_iso: toISO(best.d, best.s),
      end_iso: toISO(best.d, best.e),
      type: "TASK",
      priority: ch.priority,
    });

    // Emit a visible break right after (doesn't affect spacing)
    if (brk > 0 && best.e + brk <= latest) {
      events.push({
        id: makeId("brk", best.d, best.e, best.e + brk),
        title: "Break",
        day: DAY_NAMES[best.d],
        start_iso: toISO(best.d, best.e),
        end_iso: toISO(best.d, best.e + brk),
        type: "BREAK",
      });
    }
  }

  // De-dupe emitted events just in case
  const seen = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    const k = `${events[i].id}`;
    if (seen.has(k)) {
      events.splice(i, 1);
      i--;
    } else {
      seen.add(k);
    }
  }

  const summary =
    "Local fallback: conflict-free blocks; anchors respected; ISO times with Z; spacing and spread enabled.";

  return { summary, events, unplaced_tasks } as Plan;
}

// ===============================================================

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ScheduleRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }
    const payload: ScheduleRequest = parsed.data;

    try {
      const fewShots = [
        {
          user: fewShotUser1.content as string,
          assistant: fewShotAssistant1.content as string,
        },
      ];

      const text = await generateJsonFromGemini({
        system: `${systemPrompt}\n${jsonInstruction}`,
        fewShotPairs: fewShots,
        userPayload: JSON.stringify(payload),
      });

      const candidate = JSON.parse(text);
      const valid = PlanSchema.safeParse(candidate);
      if (!valid.success) throw new Error("Gemini returned invalid JSON");
      return NextResponse.json(valid.data satisfies Plan);
    } catch (err: any) {
      console.error("Gemini error:", err?.message || err);
      // graceful local fallback
      return NextResponse.json(localPlan(payload));
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
