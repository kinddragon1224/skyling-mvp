export default function GameHeader() {
  return (
    <header className="mb-3 rounded-2xl border-2 border-sky-100/70 bg-gradient-to-b from-sky-300 to-sky-500 px-3 py-2 shadow-[0_7px_0_rgba(15,53,94,0.65)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-white/85 text-lg shadow-inner">☁️</div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-sky-950">하늘이와 나</h1>
            <p className="text-[10px] font-semibold text-sky-900/80">Skyling Room</p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <div className="rounded-lg border border-amber-200/40 bg-sky-950/70 px-2 py-1 text-[11px] font-bold text-amber-100">🪙 0</div>
          <div className="rounded-lg border border-cyan-200/40 bg-indigo-950/70 px-2 py-1 text-[11px] font-bold text-cyan-100">💎 0</div>
        </div>
      </div>
    </header>
  );
}
