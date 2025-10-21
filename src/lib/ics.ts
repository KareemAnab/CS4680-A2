// lib/ics.ts
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"; // ← add this
dayjs.extend(utc);
import { Plan } from "./schema";

export function planToICS(plan: Plan, calName = "TimeCraft Plan") {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(`X-WR-CALNAME:${calName}`);

  for (const evt of plan.events) {
    const uid = evt.id.replace(/[^a-zA-Z0-9]/g, "") + "@timecraft";
    const dtStart = dayjs(evt.start_iso).utc().format("YYYYMMDD[T]HHmmss[Z]");
    const dtEnd = dayjs(evt.end_iso).utc().format("YYYYMMDD[T]HHmmss[Z]");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeICS(evt.title)}`);
    lines.push(`DESCRIPTION:${escapeICS(evt.type)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function escapeICS(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
