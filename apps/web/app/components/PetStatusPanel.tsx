type PetStats = {
  hp: number;
  mood: number;
  bond: number;
  growth: number;
  level?: number;
};

function StatBar({
  label,
  value,
  fillClass,
}: {
  label: string;
  value: number;
  fillClass: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm font-semibold text-amber-900">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-3.5 rounded-full bg-amber-100/90 p-[2px] shadow-inner">
        <div className={`h-full rounded-full ${fillClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function PetStatusPanel({ pet }: { pet: PetStats | null }) {
  return (
    <section className="mb-3 rounded-2xl border-2 border-amber-900/70 bg-[#f6ebd2] p-3 shadow-[0_8px_0_#5b3a1f]">
      <div className="mb-3 rounded-xl border border-amber-900/60 bg-gradient-to-b from-[#8d5c35] to-[#6e4528] px-3 py-2 text-center text-sm font-bold text-amber-100">
        🪶 하늘이 Lv.{pet?.level ?? 1}
      </div>
      <div className="space-y-3 rounded-xl bg-[#fff8ea] p-3">
        <StatBar label="체력" value={pet?.hp ?? 0} fillClass="bg-gradient-to-r from-orange-400 to-red-500" />
        <StatBar label="기분" value={pet?.mood ?? 0} fillClass="bg-gradient-to-r from-yellow-300 to-amber-400" />
        <StatBar label="친밀도" value={pet?.bond ?? 0} fillClass="bg-gradient-to-r from-lime-400 to-emerald-500" />
        <StatBar label="성장도" value={pet?.growth ?? 0} fillClass="bg-gradient-to-r from-sky-400 to-blue-500" />
      </div>
    </section>
  );
}
