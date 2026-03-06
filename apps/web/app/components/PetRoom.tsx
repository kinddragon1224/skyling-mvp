import SkyPetSprite from "./SkyPetSprite";

type PetRoomProps = {
  petName: string;
  level: number;
  stage: number;
  hp: number;
  mood: number;
  bond: number;
  message: string;
  presence: string;
  mockMode: boolean;
  showStageCongrats: boolean;
};

export default function PetRoom({
  petName,
  level,
  stage,
  hp,
  mood,
  bond,
  message,
  presence,
  mockMode,
  showStageCongrats,
}: PetRoomProps) {
  return (
    <section className="mb-2 rounded-2xl border border-sky-200/25 bg-[#0f1d3d]/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mb-2 rounded-xl border border-sky-100/25 bg-gradient-to-b from-sky-600/35 via-[#1b3f76] to-[#12213f] p-2">
        <div className="rounded-xl border border-cyan-100/20 bg-[#102549]/70 p-1">
          <div className="relative overflow-hidden rounded-lg border border-sky-100/20 bg-gradient-to-b from-[#7dd3fc33] via-[#0f2b57] to-[#0b1833]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,rgba(255,255,255,0.25),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(186,230,253,0.22),transparent_34%)]" />

            <div className="pointer-events-none absolute left-4 top-4 h-20 w-14 rounded-md border border-sky-100/30 bg-gradient-to-b from-sky-100/10 to-sky-900/20" />
            <div className="pointer-events-none absolute left-[4.8rem] top-4 h-20 w-14 rounded-md border border-sky-100/30 bg-gradient-to-b from-sky-100/10 to-sky-900/20" />

            <div className="pointer-events-none absolute bottom-5 left-4 h-3 w-3 rounded-full bg-amber-200/70 sky-star" />
            <div className="pointer-events-none absolute right-6 top-8 h-2 w-2 rounded-full bg-cyan-100/70 sky-star-delayed" />

            <div className="pointer-events-none absolute bottom-3 left-1/2 h-10 w-52 -translate-x-1/2 rounded-[50%] bg-gradient-to-t from-emerald-800/55 to-transparent" />
            <div className="pointer-events-none absolute bottom-5 left-1/2 h-6 w-36 -translate-x-1/2 rounded-[50%] bg-emerald-400/20" />

            <div className="pointer-events-none absolute right-4 bottom-8 text-lg opacity-70">🪴</div>
            <div className="pointer-events-none absolute left-5 bottom-10 text-base opacity-70">🔭</div>

            <SkyPetSprite stage={stage} hp={hp} mood={mood} bond={bond} />
          </div>
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between text-sm text-sky-100">
        <span className="font-semibold">{petName}</span>
        <span className="text-xs">Lv.{level} · Stage {stage}</span>
      </div>
      <p className="text-sm text-cyan-200">{message}</p>
      <p className="mt-1 text-xs text-sky-100/85">{presence}</p>

      {showStageCongrats ? (
        <p className="mt-2 rounded-lg bg-emerald-400/20 px-3 py-1.5 text-xs text-emerald-100">
          🎉 하늘이가 Stage 2로 진화했어!
        </p>
      ) : null}

      {mockMode ? <p className="mt-1 text-[11px] text-amber-200/95">mock 모드 · 백엔드 없이 시각화 중</p> : null}
    </section>
  );
}
