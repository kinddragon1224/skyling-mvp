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
    <section className="rounded-2xl border border-sky-200/20 bg-slate-900/40 p-3">
      <h2 className="mb-2 text-sm font-bold text-sky-100">최근 기억 3개</h2>
      <ul className="space-y-2 text-sm text-slate-100">
        {memories.length === 0 ? (
          <li className="rounded-2xl border border-slate-500/40 bg-slate-700/30 px-3 py-2">아직 남은 기억이 없어.</li>
        ) : (
          memories.map((m, idx) => {
            const isRecord = m.action === "record";
            return (
              <li
                key={`${m.created_at}-${idx}`}
                className={`rounded-2xl border px-3 py-2 ${
                  isRecord ? "border-amber-300/50 bg-amber-900/20" : "border-slate-500/40 bg-slate-700/30"
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-[11px] text-sky-200">
                  <span className={`rounded-full px-2 py-0.5 ${isRecord ? "bg-amber-500/30 text-amber-100" : "bg-slate-800/70"}`}>
                    {isRecord ? "관계 기억" : formatAction(m.action)}
                  </span>
                  <span>{formatTime(m.created_at)}</span>
                </div>
                <p className={`rounded-xl px-2 py-1 text-slate-100 ${isRecord ? "bg-amber-200/10" : "bg-white/10"}`}>{m.text}</p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
