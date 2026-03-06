type Pet = {
  hp: number;
  mood: number;
  bond: number;
  growth: number;
  level: number;
};

type ActivitySummary = {
  today: {
    pray: number;
    study: number;
    record: number;
  };
  last_action: {
    action: string;
    created_at: string;
  } | null;
};

export type InteractionSnapshot = {
  mood_summary: string;
  today_interpretation: string;
  memory_highlight: string;
  daily_report: string[];
};

export function interpretToday(activity: ActivitySummary) {
  const counts = activity.today;
  const total = counts.pray + counts.study + counts.record;
  if (total === 0) return "오늘은 멈춤에 가까운 날이야. 쉬어도 괜찮아.";
  if (counts.study >= counts.pray && counts.study >= counts.record) return "오늘은 앞으로 나아가려는 기운이 보여.";
  if (counts.record >= counts.pray && counts.record >= counts.study) return "오늘은 마음을 남기고 관계를 쌓는 날 같아.";
  return "오늘은 조용히 머물며 중심을 잡는 날이야.";
}

export function moodSummary(pet: Pet, activity: ActivitySummary) {
  const total = activity.today.pray + activity.today.study + activity.today.record;
  if (pet.hp <= 35 && pet.bond >= 65) return "지쳤지만 서로 곁에 머무는 감각이 있어.";
  if (pet.mood >= 70 && pet.growth >= 60) return "기분과 성장이 함께 오르는 좋은 흐름이야.";
  if (pet.growth >= 70 && total <= 1) return "적게 움직였어도 깊게 남긴 하루였어.";
  if (pet.bond >= 70 && activity.today.record >= 2) return "기억을 쌓으며 관계가 단단해지고 있어.";
  if (activity.last_action?.action === "study" && pet.hp <= 45) return "조금 지쳤지만, 멈추지 않으려는 의지가 보여.";
  return "오늘의 움직임이 조금씩 너와 나를 바꾸고 있어.";
}

export function buildMemoryText(action: "pray" | "study" | "record", pet: Pet, activity: ActivitySummary) {
  const templates = {
    pray: ["오늘 넌 숨을 고르고 마음을 가다듬었어.", "짧은 기도였지만 내 안엔 오래 남았어."],
    study: ["오늘의 공부는 서두름보다 의지에 가까웠어.", "넌 한 걸음씩 앞으로 가는 법을 선택했어."],
    record: ["오늘 넌 마음의 흔적을 내게 맡겼어.", "남겨둔 문장들이 우리 사이를 채우고 있어."],
  };
  const base = templates[action][Math.floor(Math.random() * templates[action].length)];
  return `${base} ${Math.random() < 0.5 ? interpretToday(activity) : moodSummary(pet, activity)}`;
}

export function buildDailyReport(pet: Pet, activity: ActivitySummary) {
  const total = activity.today.pray + activity.today.study + activity.today.record;
  const line1 = interpretToday(activity);
  const line2 =
    pet.growth >= 70 || pet.level >= 3
      ? "나는 오늘, 자라는 속도를 스스로 느끼기 시작했어."
      : pet.bond >= 65
      ? "나는 오늘, 네 곁에 머무는 법을 조금 더 배웠어."
      : "나는 오늘, 너의 리듬을 기억하는 법을 연습했어.";
  const line3 =
    total === 0
      ? "내일은 아주 작은 행동 하나만 남겨줘도 충분해."
      : activity.today.record === 0
      ? "내일은 짧은 기록 한 줄로 오늘을 봉인해보자."
      : activity.today.study === 0
      ? "내일은 아주 짧은 공부 한 번으로 길을 열어보자."
      : "내일도 한 번만 더, 우리 흐름을 이어가 보자.";

  return [line1, line2, line3];
}

export function buildInteractionSnapshot(
  pet: Pet,
  activity: ActivitySummary,
  memories: { text: string }[],
  message?: string,
): InteractionSnapshot {
  // TODO: replace template-based interpretation with external interaction engine (OpenClaw/LLM)
  return {
    mood_summary: moodSummary(pet, activity),
    today_interpretation: interpretToday(activity),
    memory_highlight: message ?? memories[0]?.text ?? "오늘의 기억이 아직 없어.",
    daily_report: buildDailyReport(pet, activity),
  };
}
