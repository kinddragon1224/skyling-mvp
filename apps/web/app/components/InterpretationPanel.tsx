type Interpretation = {
  today: string;
  state: string;
};

export default function InterpretationPanel({ interpretation }: { interpretation: Interpretation }) {
  return (
    <section className="mb-3 rounded-2xl border border-violet-200/20 bg-violet-900/25 p-3">
      <h2 className="mb-1 text-sm font-bold text-violet-100">오늘의 하늘 해석</h2>
      <p className="text-sm text-violet-100">{interpretation.today}</p>
      <p className="mt-1 text-xs text-violet-200/85">{interpretation.state}</p>
    </section>
  );
}
