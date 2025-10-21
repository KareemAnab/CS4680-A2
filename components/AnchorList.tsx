// components/AnchorList.tsx
export default function AnchorList({ anchors, setAnchors }: any) {
  function update(i: number, key: string, val: any) {
    const next = [...anchors];
    next[i] = { ...next[i], [key]: val };
    setAnchors(next);
  }
  function add() {
    setAnchors([
      ...anchors,
      { title: "New Anchor", day: "Mon", start: "13:00", end: "14:00" },
    ]);
  }
  function remove(i: number) {
    const next = [...anchors];
    next.splice(i, 1);
    setAnchors(next);
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="p-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">Anchors (fixed meetings)</h2>
      {anchors.map((a: any, i: number) => (
        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <input
            className="col-span-4 border rounded-lg px-2 py-1"
            value={a.title}
            onChange={(e) => update(i, "title", e.target.value)}
          />
          <select
            className="col-span-2 border rounded-lg px-2 py-1"
            value={a.day}
            onChange={(e) => update(i, "day", e.target.value)}
          >
            {days.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input
            className="col-span-2 border rounded-lg px-2 py-1"
            value={a.start}
            onChange={(e) => update(i, "start", e.target.value)}
            placeholder="13:00"
          />
          <input
            className="col-span-2 border rounded-lg px-2 py-1"
            value={a.end}
            onChange={(e) => update(i, "end", e.target.value)}
            placeholder="14:00"
          />
          <button className="col-span-2 text-red-600" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={add} className="mt-2 px-3 py-1 rounded-lg border">
        + Add Anchor
      </button>
    </div>
  );
}
