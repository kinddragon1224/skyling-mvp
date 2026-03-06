type ActionType = "pray" | "study" | "record";

function ActionCard({
  title,
  icon,
  tone,
  onClick,
  disabled,
}: {
  title: string;
  icon: string;
  tone: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`group rounded-2xl border-2 ${tone} p-2 text-white shadow-[0_5px_0_rgba(0,0,0,0.35)] transition active:translate-y-[2px] active:shadow-[0_3px_0_rgba(0,0,0,0.35)] disabled:opacity-50`}
    >
      <div className="mb-1 flex h-9 items-center justify-center rounded-xl bg-black/20 text-lg">{icon}</div>
      <div className="text-xs font-bold">{title}</div>
    </button>
  );
}

export default function ActionButtons({
  loading,
  onAction,
}: {
  loading: boolean;
  onAction: (action: ActionType) => void;
}) {
  return (
    <section className="mb-3 rounded-2xl border border-sky-300/20 bg-slate-900/40 p-3">
      <div className="mb-2 text-xs font-semibold text-sky-200">오늘의 행동</div>
      <div className="grid grid-cols-3 gap-2">
        <ActionCard title="기도하기" icon="🙏" tone="border-sky-200/70 bg-gradient-to-b from-sky-500 to-sky-700" disabled={loading} onClick={() => onAction("pray")} />
        <ActionCard title="공부하기" icon="📘" tone="border-indigo-200/70 bg-gradient-to-b from-indigo-500 to-indigo-700" disabled={loading} onClick={() => onAction("study")} />
        <ActionCard title="기록하기" icon="📝" tone="border-amber-200/70 bg-gradient-to-b from-amber-500 to-orange-700" disabled={loading} onClick={() => onAction("record")} />
      </div>
    </section>
  );
}
