type Interpretation = {
  today: string;
  state: string;
  summary?: string;
};

export default function InterpretationPanel({ interpretation }: { interpretation: Interpretation }) {
  return (
    <section className="mb-3 rounded-2xl border border-violet-200/20 bg-violet-900/25 p-3">
      <h2 className="mb-1 text-sm font-bold text-violet-100">해석 요약</h2>
      <p className="text-sm text-violet-100">{interpretation.summary ?? interpretation.today}</p>
      <details className="mt-2 text-xs text-violet-200/85">
        <summary className="cursor-pointer select-none">더 보기</summary>
        <p className="mt-2">{interpretation.today}</p>
        <p className="mt-1">{interpretation.state}</p>
      </details>
    </section>
  );
}
