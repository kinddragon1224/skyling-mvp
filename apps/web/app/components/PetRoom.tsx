type PetRoomProps = {
  petName: string;
  level: number;
  stage: number;
  message: string;
  presence: string;
  mockMode: boolean;
  showStageCongrats: boolean;
  imageLoaded: boolean;
  imageIndex: number;
  imageCandidates: string[];
  onImageLoad: () => void;
  onImageError: () => void;
};

export default function PetRoom({
  petName,
  level,
  stage,
  message,
  presence,
  mockMode,
  showStageCongrats,
  imageLoaded,
  imageIndex,
  imageCandidates,
  onImageLoad,
  onImageError,
}: PetRoomProps) {
  return (
    <section className="mb-3 rounded-2xl border border-sky-200/25 bg-[#0f1d3d]/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mb-2 rounded-xl border border-sky-100/20 bg-gradient-to-b from-sky-600/35 via-[#1b3f76] to-[#12213f] p-2">
        <div className="relative overflow-hidden rounded-lg border border-cyan-100/20 bg-gradient-to-b from-sky-200/20 via-sky-700/20 to-slate-950/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.35),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(186,230,253,0.3),transparent_32%)]" />
          <div className="pointer-events-none absolute bottom-0 h-12 w-full bg-gradient-to-t from-emerald-900/45 to-transparent" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 h-4 w-40 -translate-x-1/2 rounded-full bg-black/30 blur-sm" />

          {imageIndex < imageCandidates.length ? (
            <>
              <img
                src={imageCandidates[imageIndex]}
                alt="하늘이"
                className={`relative z-10 h-48 w-full object-contain transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={onImageLoad}
                onError={onImageError}
              />
              {!imageLoaded ? (
                <div className="absolute inset-0 z-20 flex h-48 items-center justify-center text-sm font-semibold text-cyan-100">
                  하늘 방을 정리하는 중…
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-1 text-cyan-100">
              <span className="text-3xl">☁️</span>
              <span className="text-xs">하늘 방에서 쉬는 중…</span>
            </div>
          )}
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
