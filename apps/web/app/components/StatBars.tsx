type PetStats = {
  hp: number;
  mood: number;
  bond: number;
  growth: number;
};

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 rounded bg-slate-700">
        <div className="h-2 rounded bg-sky-400" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function StatBars({ pet }: { pet: PetStats | null }) {
  return (
    <section className="mb-3 space-y-3 rounded-xl bg-slate-800 p-4">
      <StatBar label="체력" value={pet?.hp ?? 0} />
      <StatBar label="기분" value={pet?.mood ?? 0} />
      <StatBar label="친밀도" value={pet?.bond ?? 0} />
      <StatBar label="성장도" value={pet?.growth ?? 0} />
    </section>
  );
}
