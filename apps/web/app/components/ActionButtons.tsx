type ActionType = "pray" | "study" | "record";

export default function ActionButtons({
  loading,
  onAction,
}: {
  loading: boolean;
  onAction: (action: ActionType) => void;
}) {
  return (
    <section className="mb-3 grid grid-cols-3 gap-2">
      <button
        className="rounded-lg bg-sky-600 p-3 text-sm font-semibold disabled:opacity-50"
        disabled={loading}
        onClick={() => onAction("pray")}
      >
        기도하기
      </button>
      <button
        className="rounded-lg bg-indigo-600 p-3 text-sm font-semibold disabled:opacity-50"
        disabled={loading}
        onClick={() => onAction("study")}
      >
        공부하기
      </button>
      <button
        className="rounded-lg bg-amber-600 p-3 text-sm font-semibold disabled:opacity-50"
        disabled={loading}
        onClick={() => onAction("record")}
      >
        기록하기
      </button>
    </section>
  );
}
