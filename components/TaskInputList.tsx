// components/TaskInputList.tsx
import { v4 as uuid } from "uuid";

export default function TaskInputList({ tasks, setTasks }: any) {
  function add() {
    setTasks([
      ...tasks,
      { id: uuid(), title: "New Task", est_minutes: 60, priority: "P2" },
    ]);
  }
  function update(i: number, key: string, val: any) {
    const next = [...tasks];
    next[i] = { ...next[i], [key]: val };
    setTasks(next);
  }
  function remove(i: number) {
    const next = [...tasks];
    next.splice(i, 1);
    setTasks(next);
  }

  return (
    <div className="p-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">Tasks</h2>
      <div className="space-y-2">
        {tasks.map((t: any, i: number) => (
          <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
            <input
              className="col-span-6 border rounded-lg px-2 py-1"
              value={t.title}
              onChange={(e) => update(i, "title", e.target.value)}
            />
            <input
              type="number"
              className="col-span-2 border rounded-lg px-2 py-1"
              value={t.est_minutes || ""}
              placeholder="mins"
              onChange={(e) => update(i, "est_minutes", Number(e.target.value))}
            />
            <select
              className="col-span-2 border rounded-lg px-2 py-1"
              value={t.priority || "P2"}
              onChange={(e) => update(i, "priority", e.target.value)}
            >
              <option>P1</option>
              <option>P2</option>
              <option>P3</option>
            </select>
            <button
              className="col-span-2 text-red-600"
              onClick={() => remove(i)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-3 px-3 py-1 rounded-lg border">
        + Add Task
      </button>
    </div>
  );
}
