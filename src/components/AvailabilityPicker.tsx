// components/AvailabilityPicker.tsx
export default function AvailabilityPicker({
  availability,
  setAvailability,
}: any) {
  function update(i: number, key: string, val: any) {
    const next = [...availability];
    next[i] = { ...next[i], [key]: val };
    setAvailability(next);
  }
  function add() {
    setAvailability([
      ...availability,
      { day: "Tue", start: "09:00", end: "17:00" },
    ]);
  }
  function remove(i: number) {
    const next = [...availability];
    next.splice(i, 1);
    setAvailability(next);
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="p-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">Availability</h2>
      {availability.map((a: any, i: number) => (
        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <select
            className="col-span-3 border rounded-lg px-2 py-1"
            value={a.day}
            onChange={(e) => update(i, "day", e.target.value)}
          >
            {days.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input
            className="col-span-3 border rounded-lg px-2 py-1"
            value={a.start}
            onChange={(e) => update(i, "start", e.target.value)}
            placeholder="09:00"
          />
          <input
            className="col-span-3 border rounded-lg px-2 py-1"
            value={a.end}
            onChange={(e) => update(i, "end", e.target.value)}
            placeholder="17:00"
          />
          <button className="col-span-3 text-red-600" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={add} className="mt-2 px-3 py-1 rounded-lg border">
        + Add Window
      </button>
    </div>
  );
}
