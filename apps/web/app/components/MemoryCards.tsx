export type MemoryItem = {
  text: string;
  action: string;
  created_at: string;
};

function formatAction(action: string) {
  if (action === "pray") return "기도";
  if (action === "study") return "공부";
  if (action === "record") return "기록";
  return "기억";
}

function formatTime(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "방금";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MemoryCards({ memories }: { memories: MemoryItem[] }) {
  return (
    <section className="rounded-xl bg-slate-800 p-4">
      <h2 className="mb-2 text-sm font-semibold">최근 기억 3개</h2>
      <ul className="space-y-2 text-sm text-slate-200">
        {memories.length === 0 ? (
          <li className="rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">아직 남은 기억이 없어.</li>
        ) : (
          memories.map((m, idx) => (
            <li key={`${m.created_at}-${idx}`} className="rounded-xl border border-slate-600 bg-slate-700/40 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>{formatAction(m.action)}</span>
                <span>{formatTime(m.created_at)}</span>
              </div>
              <p>{m.text}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
