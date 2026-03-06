type ActivitySummary = {
  today: {
    pray: number;
    study: number;
    record: number;
  };
  total_actions?: number;
  dominant_action?: string | null;
  record_input_count?: number;
  actions_since_record_input?: number;
  record_resonance?: number;
  last_record_input?: {
    text?: string | null;
    mood?: string | null;
    created_at?: string;
  } | null;
  first_action?: {
    action: string;
    created_at: string;
  } | null;
  last_action: {
    action: string;
    created_at: string;
  } | null;
};

function actionLabel(action: string) {
  if (action === "pray") return "기도하기";
  if (action === "study") return "공부하기";
  if (action === "record") return "기록하기";
  return "-";
}

function lastTimeText(ts?: string) {
  if (!ts) return "아직 없음";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "방금 전";
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `오늘 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function moodLabel(mood?: string | null) {
  if (mood === "calm") return "차분";
  if (mood === "tired") return "지침";
  if (mood === "grateful") return "고마움";
  if (mood === "anxious") return "불안";
  if (mood === "hopeful") return "기대";
  return "기록됨";
}

function resonanceText(level?: number) {
  if (!level || level <= 0) return "";
  if (level >= 2) return "기록 여운이 진하게 남아 있어";
  return "마음의 잔향이 이어지는 중";
}

export default function DailyLoopPanel({
  activity,
  todayMemory,
  flowType,
  levelUp,
  stageEvent,
}: {
  activity: ActivitySummary;
  todayMemory?: string;
  flowType?: string;
  levelUp: boolean;
  stageEvent: boolean;
}) {
  return (
    <section className="mb-3 rounded-2xl border border-sky-200/20 bg-slate-900/45 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-sky-100">오늘의 행동</h2>
        <span className="rounded-full bg-sky-800/60 px-2 py-0.5 text-[10px] font-semibold text-sky-100">{flowType ?? "흐름 관찰중"}</span>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-sky-900/40 px-2 py-2 text-center text-sky-100">기도하기 {activity.today.pray}회</div>
        <div className="rounded-xl bg-indigo-900/40 px-2 py-2 text-center text-sky-100">공부하기 {activity.today.study}회</div>
        <div className="rounded-xl bg-amber-900/40 px-2 py-2 text-center text-sky-100">기록하기 {activity.today.record}회</div>
      </div>

      <div className="rounded-xl border border-slate-500/30 bg-slate-800/40 px-3 py-2 text-xs text-sky-100">
        <p>첫 행동: {activity.first_action ? actionLabel(activity.first_action.action) : "아직 없음"}</p>
        <p className="mt-0.5">가장 많이 한 행동: {activity.dominant_action ? actionLabel(activity.dominant_action) : "아직 없음"}</p>
        <p className="mt-0.5">마지막 행동: {activity.last_action ? actionLabel(activity.last_action.action) : "아직 없음"}</p>
        <p className="mt-0.5 text-sky-200/80">시간: {lastTimeText(activity.last_action?.created_at)}</p>
      </div>

      <div className="mt-2 rounded-xl border border-violet-300/30 bg-violet-900/20 px-3 py-2 text-xs text-violet-100">
        {activity.record_input_count && activity.record_input_count > 0 ? (
          <>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] font-semibold">오늘 마음 기록 있음</span>
              <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px]">관계 밀도 상승</span>
            </div>
            <p>
              오늘 남긴 마음: <span className="font-semibold">{moodLabel(activity.last_record_input?.mood)}</span>
            </p>
            {resonanceText(activity.record_resonance) ? <p className="mt-0.5 text-violet-200/90">{resonanceText(activity.record_resonance)}</p> : null}
          </>
        ) : (
          <p className="text-violet-200/85">아직 마음 기록이 없어. 오늘 한 줄 남기면 해석이 더 깊어져.</p>
        )}
      </div>

      <div className="mt-2 rounded-xl border border-cyan-300/30 bg-cyan-900/20 px-3 py-2 text-xs text-cyan-100">
        <p className="mb-1 font-semibold">오늘의 기억</p>
        <p>{todayMemory ?? "오늘의 기억이 아직 없어."}</p>
      </div>

      {levelUp ? <p className="mt-2 inline-block rounded-full bg-amber-400/25 px-3 py-1 text-xs font-bold text-amber-100">✨ 레벨업!</p> : null}
      {stageEvent ? <p className="mt-2 text-xs text-emerald-200">하늘이가 조금 더 자랐어 🌱</p> : null}
    </section>
  );
}
