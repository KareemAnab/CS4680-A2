// lib/prompt.ts

export const systemPrompt = `You are TimeCraft, a pragmatic time-blocking coach for students and professionals.
Goals: produce a realistic, conflict-free schedule as JSON compliant with the schema.
Rules:
- Respect availability windows and meeting anchors.
- Default block length 50–90 min with 5–15 min breaks (use preferences if provided).
- Prioritize P1 before P2, P3; consider deadlines and due dates.
- If time is insufficient, populate unplaced_tasks with human-friendly reasons.
- Do not invent tasks or anchors. Do not exceed latest_end or start before earliest_start.
- Output is a JSON object with { summary, unplaced_tasks, events[] } ONLY.
Tone: concise, supportive, no filler language.`;

export const fewShotUser1 = {
  role: "user",
  content: JSON.stringify({
    tasks: [
      {
        title: "Finish lab report",
        est_minutes: 180,
        priority: "P1",
        hard_deadline: "2025-10-18T23:59:00",
      },
      { title: "Read OS ch.4", est_minutes: 60, priority: "P2" },
    ],
    availability: [{ day: "Mon", start: "09:00", end: "12:00" }],
    anchors: [
      { title: "Math lecture", day: "Mon", start: "10:30", end: "11:20" },
    ],
    preferences: {
      focus_block_min: 60,
      break_min: 10,
      earliest_start: "09:00",
      latest_end: "12:00",
    },
    baseDateISO: "2025-10-20T00:00:00",
  }),
} as const;

export const fewShotAssistant1 = {
  role: "assistant",
  content: JSON.stringify({
    summary:
      "Front-loaded P1 and protected the lecture; scheduled one 60-min block and deferred remaining 2h.",
    unplaced_tasks: [
      "Finish lab report: needs 120 more minutes",
      "Read OS ch.4: needs 60 minutes",
    ],
    events: [
      {
        id: "task:Finish lab report",
        title: "Finish lab report (focus)",
        day: "Mon",
        start_iso: "2025-10-20T09:00:00",
        end_iso: "2025-10-20T10:00:00",
        type: "TASK",
        priority: "P1",
      },
      {
        id: "break:1",
        title: "Break",
        day: "Mon",
        start_iso: "2025-10-20T10:00:00",
        end_iso: "2025-10-20T10:10:00",
        type: "BREAK",
      },
      {
        id: "anchor:Math lecture",
        title: "Math lecture",
        day: "Mon",
        start_iso: "2025-10-20T10:30:00",
        end_iso: "2025-10-20T11:20:00",
        type: "ANCHOR",
      },
    ],
  }),
} as const;

export const jsonInstruction = `Return ONLY a valid JSON object matching the schema. Do not include code fences. Do not include commentary.`;
