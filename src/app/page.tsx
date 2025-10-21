// src/app/page.tsx
"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

import Loader from "@/components/Loader";
import TaskInputList from "@/components/TaskInputList";
import AvailabilityPicker from "@/components/AvailabilityPicker";
import AnchorList from "@/components/AnchorList";
import PreferencesCard from "@/components/PreferencesCard";
import Timeline from "@/components/Timeline";
import UnplacedPanel from "@/components/UnplacedPanel";
import RefineBar from "@/components/RefineBar";

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([
    { id: uuid(), title: "Study OS ch.4", est_minutes: 120, priority: "P1" },
    { id: uuid(), title: "Gym", est_minutes: 60, priority: "P3" },
  ]);
  const [availability, setAvailability] = useState<any[]>([
    { day: "Mon", start: "09:00", end: "17:00" },
  ]);
  const [anchors, setAnchors] = useState<any[]>([
    { title: "CS Lecture", day: "Mon", start: "10:30", end: "11:45" },
  ]);
  const [preferences, setPreferences] = useState<any>({
    focus_block_min: 60,
    break_min: 10,
    earliest_start: "09:00",
    latest_end: "20:00",
    max_daily_focus_min: 240, // NEW: 4 hours/day cap
  });

  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // next Monday-ish as base date for ISO assembly
  const baseDateISO = dayjs().startOf("week").add(1, "day").toISOString();

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks,
        availability,
        anchors,
        preferences,
        baseDateISO,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert("Error: " + JSON.stringify(data.error || data));
    setPlan(data);
  }

  async function refine(instruction: string) {
    if (!plan) return;
    setLoading(true);
    const res = await fetch("/api/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previousPlan: plan,
        instruction,
        hardConstraints: { availability, anchors, preferences, baseDateISO },
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return alert("Error: " + JSON.stringify(data.error || data));
    setPlan(data);
  }

  async function downloadICS() {
    if (!plan) return;
    const res = await fetch("/api/ics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TimeCraft.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">
        TimeCraft – AI Time-Block Scheduler
      </h1>
      <p className="text-gray-600">
        Enter tasks, availability, and anchors. Generate a realistic,
        conflict-free plan. Refine naturally.
      </p>

      <div className="grid md:grid-cols-[320px,1fr] gap-6">
        <div className="space-y-4">
          <TaskInputList tasks={tasks} setTasks={setTasks} />
          <AvailabilityPicker
            availability={availability}
            setAvailability={setAvailability}
          />
          <AnchorList anchors={anchors} setAnchors={setAnchors} />
          <PreferencesCard
            preferences={preferences}
            setPreferences={setPreferences}
          />
          <div className="flex gap-3">
            <button
              onClick={generate}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              Generate Schedule
            </button>
            <button
              onClick={downloadICS}
              className="px-4 py-2 rounded-lg border"
            >
              Download .ics
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading && <Loader />}
          {plan ? (
            <>
              <Timeline plan={plan} />
              <UnplacedPanel plan={plan} />
              <RefineBar onRefine={refine} />
            </>
          ) : (
            <div className="text-gray-500">
              No plan yet. Click <b>Generate Schedule</b>.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
