// components/PreferencesCard.tsx
export default function PreferencesCard({ preferences, setPreferences }: any) {
  function update(key: string, val: any) {
    setPreferences({ ...preferences, [key]: val });
  }
  return (
    <div className="p-4 border rounded-2xl">
      <h2 className="font-semibold mb-2">Preferences</h2>
      <div className="grid grid-cols-12 gap-2 items-center mb-2">
        <label className="col-span-5">Focus block (min)</label>
        <input
          type="number"
          className="col-span-7 border rounded-lg px-2 py-1"
          value={preferences.focus_block_min || 60}
          onChange={(e) => update("focus_block_min", Number(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-12 gap-2 items-center mb-2">
        <label className="col-span-5">Break (min)</label>
        <input
          type="number"
          className="col-span-7 border rounded-lg px-2 py-1"
          value={preferences.break_min || 10}
          onChange={(e) => update("break_min", Number(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-12 gap-2 items-center mb-2">
        <label className="col-span-5">Earliest start</label>
        <input
          className="col-span-7 border rounded-lg px-2 py-1"
          value={preferences.earliest_start || "09:00"}
          onChange={(e) => update("earliest_start", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-12 gap-2 items-center">
        <label className="col-span-5">Latest end</label>
        <input
          className="col-span-7 border rounded-lg px-2 py-1"
          value={preferences.latest_end || "20:00"}
          onChange={(e) => update("latest_end", e.target.value)}
        />
      </div>
    </div>
  );
}
