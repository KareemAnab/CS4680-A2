import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayName = (typeof DAY_ORDER)[number];

type Plan = {
  summary: string;
  unplaced_tasks?: string[];
  events: {
    id: string;
    title: string;
    day: DayName;
    start_iso: string;
    end_iso: string;
    type: "TASK" | "BREAK" | "ANCHOR";
    priority?: "P1" | "P2" | "P3";
  }[];
};

export default function Timeline({ plan }: { plan: Plan }) {
  const days = DAY_ORDER;
  const HOUR_PX = 56; // keep in sync with CSS row height

  // ---------- Dynamic visible window (so 4–5 AM shows up) ----------
  const starts = plan.events.map((e) => dayjs.utc(e.start_iso));
  const ends = plan.events.map((e) => dayjs.utc(e.end_iso));

  // Default window if no events: 08:00–20:00
  const defaultStart = 8;
  const defaultEnd = 20;

  let startHour = defaultStart;
  let endHour = defaultEnd;

  if (starts.length && ends.length) {
    const minStart = Math.min(...starts.map((d) => d.hour() + d.minute() / 60));
    const maxEnd = Math.max(...ends.map((d) => d.hour() + d.minute() / 60));

    // Add a small buffer above/below; clamp to [0, 24]
    startHour = Math.max(0, Math.floor(minStart) - 1);
    endHour = Math.min(24, Math.ceil(maxEnd) + 1);

    // Ensure at least a reasonable window (in case all events are the same hour)
    if (endHour - startHour < 6) {
      endHour = Math.min(24, startHour + 6);
    }
  }

  // Build hour ticks inclusively
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour
  );
  const trackHeight = hours.length * HOUR_PX;

  const cls = (e: Plan["events"][number]) => {
    if (e.type === "BREAK") return "tc-break";
    if (e.type === "ANCHOR") return "tc-anchor";
    if (e.priority === "P1") return "tc-p1";
    if (e.priority === "P2") return "tc-p2";
    return "tc-p3";
  };

  const zIndex = (e: Plan["events"][number]) =>
    e.type === "BREAK" ? 3 : e.type === "ANCHOR" ? 0 : 2; // BREAK on top

  return (
    <div className="border rounded-2xl p-4">
      <h2 className="font-semibold mb-2">Schedule</h2>
      <p className="text-sm text-gray-600 mb-3">{plan.summary}</p>

      {/* Responsive week grid:
          - 64px time column
          - 7 equal columns that shrink to fit (no horizontal scroll) */}
      <div
        className="tc-week"
        style={{
          gridTemplateColumns: `64px repeat(${days.length}, minmax(100px, 1fr))`,
        }}
      >
        {/* header row */}
        <div />
        {days.map((d) => (
          <div key={d} className="tc-week-header">
            {d}
          </div>
        ))}

        {/* time labels */}
        <div className="tc-week-times">
          {hours.map((h) => (
            <div key={h} className="tc-hour">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* day columns */}
        {days.map((day) => (
          <div key={day} className="tc-daycol" style={{ height: trackHeight }}>
            {hours.map((_, i) => (
              <div key={i} className="tc-guide" style={{ top: i * HOUR_PX }} />
            ))}

            {plan.events
              .filter((e) => e.day === day)
              .map((e) => {
                const start = dayjs.utc(e.start_iso);
                const end = dayjs.utc(e.end_iso);

                // Position from the dynamic window's startHour
                const startFloat = start.hour() + start.minute() / 60;
                const minutes = end.diff(start, "minute");

                const top = (startFloat - startHour) * HOUR_PX;
                let height = (minutes / 60) * HOUR_PX;

                if (e.type === "BREAK") {
                  // keep breaks readable but short
                  height = Math.min(height, Math.max(14, height));
                } else {
                  height = Math.max(24, height);
                }

                return (
                  <div
                    key={e.id}
                    className={`tc-block ${cls(e)}`}
                    style={{ top, height, zIndex: zIndex(e) }}
                    title={`${e.title} • ${start.format("HH:mm")}–${end.format(
                      "HH:mm"
                    )}`}
                  >
                    <div className="font-medium text-sm leading-tight">
                      {e.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {start.format("HH:mm")}–{end.format("HH:mm")} • {e.type}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {plan.unplaced_tasks?.length ? (
        <div className="mt-3 text-sm text-amber-700">
          Unplaced: {plan.unplaced_tasks.join("; ")}
        </div>
      ) : null}
    </div>
  );
}
