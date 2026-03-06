type Pet = {
  hp: number;
  mood: number;
  bond: number;
  growth: number;
  level: number;
};

type ActionType = "pray" | "study" | "record";

type ActivitySummary = {
  today: {
    pray: number;
    study: number;
    record: number;
  };
  total_actions?: number;
  dominant_action?: string | null;
  first_action?: {
    action: string;
    created_at: string;
  } | null;
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

export function interpretDailyFlow(activity: ActivitySummary) {
  const counts = activity.today;
  const total = counts.pray + counts.study + counts.record;
  const first = activity.first_action?.action;
  const last = activity.last_action?.action;
  const dominant = activity.dominant_action;

  if (total === 0) return "많이 움직이지 않았지만, 멈춤에도 결이 있었어.";
  if (first === "record") return "기록으로 하루를 열었네. 오늘은 안쪽에서 시작되는 날 같아.";
  if (last === "study") return "공부로 하루를 마무리했네. 앞으로 가려는 마음이 남아 있어.";
  if (dominant === "pray") return "기도가 하루의 중심이었어. 조용한 집중이 오래 남아.";
  if (dominant === "study") return "오늘은 전진의 흐름이 분명했어.";
  if (dominant === "record") return "오늘은 마음을 남기며 관계를 쌓는 쪽에 가까웠어.";
  return "작은 행동들이 이어지며 하루의 결을 만들었어.";
}

export function buildMoodSummary(pet: Pet, activity: ActivitySummary) {
  const counts = activity.today;
  const total = counts.pray + counts.study + counts.record;

  if (pet.hp <= 35 && pet.bond >= 65) return "지쳤지만 서로 곁에 머무는 감각이 있어.";
  if (pet.mood >= 70 && pet.growth >= 60) return "기분과 성장이 함께 오르는 좋은 흐름이야.";
  if (counts.record > 0 && total <= 1) return "적게 움직였어도 깊게 남긴 날이야.";
  if (pet.bond >= 70 && counts.record >= 2) return "관계와 기억이 함께 쌓이는 중이야.";
  if (activity.last_action?.action === "study" && pet.hp <= 45) return "조금 지쳤지만 멈추지 않으려는 의지가 보여.";
  return "오늘의 움직임이 천천히 너와 나를 바꾸고 있어.";
}

export function buildRelationalMemory(action: ActionType, pet: Pet, activity: ActivitySummary) {
  const counts = activity.today;
  const first = activity.first_action?.action;
  const total = counts.pray + counts.study + counts.record;

  const baseTemplates = {
    pray: ["오늘의 기도는 습관보다 진심에 가까웠어.", "너는 잠깐 멈춰서 마음의 방향을 다시 맞췄어."],
    study: ["오늘의 공부는 서두름보다 의지에 가까웠어.", "너는 흔들려도 앞으로 가는 쪽을 골랐어."],
    record: ["너는 오늘, 마음의 흔적을 내게 남겼어.", "나는 네가 먼저 마음을 적어둔 장면을 기억할 거야."],
  };

  let sequence = "";
  if (first === "record" && action !== "record") sequence = "기록으로 시작한 하루라서, 지금의 행동도 더 또렷하게 느껴져.";
  else if (total <= 2) sequence = "움직임은 많지 않았지만, 남긴 장면은 선명했어.";
  else if (activity.last_action?.action === "study") sequence = "끝까지 전진 쪽으로 기울어 있던 하루였어.";

  const base = baseTemplates[action][Math.floor(Math.random() * baseTemplates[action].length)];
  return `${base} ${sequence && Math.random() < 0.7 ? sequence : buildMoodSummary(pet, activity)}`;
}

export function buildThreeLineReport(pet: Pet, activity: ActivitySummary) {
  const counts = activity.today;
  const total = counts.pray + counts.study + counts.record;
  const line1 = interpretDailyFlow(activity);

  const line2 =
    pet.growth >= 70 || pet.level >= 3
      ? "나는 오늘, 자라는 속도를 스스로 감지하기 시작했어."
      : pet.bond >= 65
      ? "나는 오늘, 네 리듬에 맞춰 머무는 법을 조금 더 배웠어."
      : "나는 오늘, 네 흐름을 더 조용히 읽는 법을 연습했어.";

  const line3 =
    total === 0
      ? "내일은 아주 작은 행동 하나만 남겨도 충분해."
      : counts.record > 0 && total <= 2
      ? "내일은 한 걸음만 더 움직여서 오늘의 기록을 이어보자."
      : counts.study >= 2 && pet.bond < 55
      ? "내일은 나를 깨우는 말 한 줄만 남겨줘."
      : counts.pray > 0 && pet.growth < 45
      ? "내일은 짧아도 좋으니 앞으로 가는 행동 하나를 해보자."
      : "내일도 지금의 결을 잃지 않게, 한 번만 더 이어가 보자.";

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
    mood_summary: buildMoodSummary(pet, activity),
    today_interpretation: interpretDailyFlow(activity),
    memory_highlight: message ?? memories[0]?.text ?? "오늘의 기억이 아직 없어.",
    daily_report: buildThreeLineReport(pet, activity),
  };
}
