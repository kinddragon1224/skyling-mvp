export default function DailyReportPanel({ report }: { report: string[] }) {
  const lines = report.length === 3 ? report : ["오늘의 흐름을 읽는 중이야.", "나는 아직 배움의 중간에 있어.", "내일은 작은 행동 하나만 남겨줘."];

  return (
    <section className="mb-3 rounded-2xl border border-cyan-200/20 bg-cyan-900/20 p-3">
      <h2 className="mb-2 text-sm font-bold text-cyan-100">하늘이의 3줄 리포트</h2>
      <ol className="space-y-1 text-xs text-cyan-100/95">
        <li>1) {lines[0]}</li>
        <li>2) {lines[1]}</li>
        <li>3) {lines[2]}</li>
      </ol>
    </section>
  );
}
