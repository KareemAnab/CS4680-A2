// lib/schema.ts
import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  est_minutes: z.number().int().positive().optional(),
  priority: z.enum(["P1", "P2", "P3"]).optional(),
  hard_deadline: z.string().datetime().optional(), // ISO
  notes: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const AvailabilitySchema = z.object({
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  start: z.string(), // "09:00"
  end: z.string(), // "17:30"
});
export type Availability = z.infer<typeof AvailabilitySchema>;

export const AnchorSchema = z.object({
  title: z.string().min(1),
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  start: z.string(),
  end: z.string(),
});
export type Anchor = z.infer<typeof AnchorSchema>;

export const PreferencesSchema = z.object({
  focus_block_min: z.number().int().min(15).max(240).optional(),
  break_min: z.number().int().min(5).max(60).optional(),
  earliest_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  latest_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),

  // ✅ NEW: soft daily cap for spreading work across days
  max_daily_focus_min: z.number().int().min(30).max(720).optional(),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

export const ScheduleEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  start_iso: z.string().datetime(),
  end_iso: z.string().datetime(),
  type: z.enum(["TASK", "BREAK", "ANCHOR"]),
  priority: z.enum(["P1", "P2", "P3"]).optional(),
});
export type ScheduleEvent = z.infer<typeof ScheduleEventSchema>;

export const PlanSchema = z.object({
  summary: z.string(),
  unplaced_tasks: z.array(z.string()).optional(),
  events: z.array(ScheduleEventSchema),
});
export type Plan = z.infer<typeof PlanSchema>;

export const ScheduleRequestSchema = z.object({
  tasks: z.array(TaskSchema),
  availability: z.array(AvailabilitySchema),
  anchors: z.array(AnchorSchema).optional().default([]),
  preferences: PreferencesSchema.optional().default({}),
  baseDateISO: z.string().datetime().optional(),
});
export type ScheduleRequest = z.infer<typeof ScheduleRequestSchema>;

export const RefineRequestSchema = z.object({
  previousPlan: PlanSchema,
  instruction: z.string().min(1),
  hardConstraints: z
    .object({
      availability: z.array(AvailabilitySchema).optional(),
      anchors: z.array(AnchorSchema).optional(),
      preferences: PreferencesSchema.optional(),
      baseDateISO: z.string().datetime().optional(),
    })
    .optional(),
});
export type RefineRequest = z.infer<typeof RefineRequestSchema>;
