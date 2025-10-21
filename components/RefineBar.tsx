// components/RefineBar.tsx
import { useState } from "react";
export default function RefineBar({
  onRefine,
}: {
  onRefine: (s: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="border rounded-2xl p-3 flex gap-2">
      <input
        className="flex-1 border rounded-lg px-2 py-1"
        placeholder="Refine: e.g. move gym to 18:00; front‑load P1"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="px-4 py-1 rounded-lg bg-black text-white"
        onClick={() => onRefine(text)}
      >
        Apply
      </button>
    </div>
  );
}
