// components/UnplacedPanel.tsx
export default function UnplacedPanel({ plan }: any) {
  if (!plan.unplaced_tasks || plan.unplaced_tasks.length === 0) return null;
  return (
    <div className="border rounded-2xl p-4">
      <h2 className="font-semibold mb-2">Unplaced Tasks</h2>
      <ul className="list-disc ml-6 text-sm">
        {plan.unplaced_tasks.map((u: string, i: number) => (
          <li key={i}>{u}</li>
        ))}
      </ul>
    </div>
  );
}
