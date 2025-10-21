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
    start_iso: string; // ISO with Z
    end_iso: string; // ISO with Z
    type: "TASK" | "BREAK" | "ANCHOR";
    priority?: "P1" | "P2" | "P3";
  }[];
};

export default function Timeline({ plan }: { plan: Plan }) {
  const days = DAY_ORDER;

  // ----- fixed 24h window -----
  const START_HOUR = 0; // 00:00
  const END_HOUR = 24; // render up to 24:00 line
  const HOUR_PX = 56; // row height
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => i + START_HOUR
  );
  const trackHeight = (END_HOUR - START_HOUR) * HOUR_PX;

  // simple styling helpers
  const cls = (e: Plan["events"][number]) => {
    if (e.type === "BREAK") return "tc-break";
    if (e.type === "ANCHOR") return "tc-anchor";
    if (e.priority === "P1") return "tc-p1";
    if (e.priority === "P2") return "tc-p2";
    return "tc-p3";
  };
  const zIndex = (e: Plan["events"][number]) =>
    e.type === "BREAK" ? 3 : e.type === "ANCHOR" ? 0 : 2; // show BREAK on top

  return (
    <div className="border rounded-2xl p-4">
      <h2 className="font-semibold mb-2">Schedule</h2>
      <p className="text-sm text-gray-600 mb-3">{plan.summary}</p>

      <div
        className="tc-week overflow-y-auto"
        style={{
          // time column + seven day columns
          gridTemplateColumns: `64px repeat(${days.length}, minmax(100px, 1fr))`,
          maxHeight: "75vh",
        }}
      >
        {/* header row */}
        <div />
        {days.map((d) => (
          <div key={d} className="tc-week-header">
            {d}
          </div>
        ))}

        {/* time labels (00:00 → 24:00) */}
        <div className="tc-week-times" style={{ height: trackHeight }}>
          {hours.slice(0, -1).map((h) => (
            <div key={h} className="tc-hour" style={{ height: HOUR_PX }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
          {/* draw the 24:00 label at the end */}
          <div className="tc-hour" style={{ height: HOUR_PX }}>
            {String(END_HOUR).padStart(2, "0")}:00
          </div>
        </div>

        {/* day columns */}
        {days.map((day) => (
          <div
            key={day}
            className="tc-daycol relative"
            style={{ height: trackHeight }}
          >
            {/* hour guides */}
            {hours.map((_, i) => (
              <div key={i} className="tc-guide" style={{ top: i * HOUR_PX }} />
            ))}

            {/* events */}
            {plan.events
              .filter((e) => e.day === day)
              .map((e) => {
                const start = dayjs.utc(e.start_iso);
                const end = dayjs.utc(e.end_iso);

                // position relative to 00:00
                const startFloat = start.hour() + start.minute() / 60; // 0..23.99
                const minutes = Math.max(0, end.diff(start, "minute"));

                const top = (startFloat - START_HOUR) * HOUR_PX;
                let height = (minutes / 60) * HOUR_PX;

                // ensure readable block sizes
                if (e.type === "BREAK") {
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
                    )} • ${e.type}`}
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

      {/* unplaced list (still shows tasks; anchors are expected to be hard constraints) */}
      {plan.unplaced_tasks?.length ? (
        <div className="mt-3 text-sm text-amber-700">
          Unplaced: {plan.unplaced_tasks.join("; ")}
        </div>
      ) : null}
    </div>
  );
}
