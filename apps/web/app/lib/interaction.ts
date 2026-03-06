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
  flow_type?: string;
  record_input_count?: number;
  actions_since_record_input?: number;
  record_resonance?: number;
  last_record_input?: { text?: string | null; mood?: string | null; created_at?: string } | null;
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
  flow_type?: string;
  short_reaction: string;
  room_bubble: string;
  interpretation_summary: string;
  mood_summary: string;
  today_interpretation: string;
  memory_highlight: string;
  daily_report: string[];
  full_report: string[];
};

function total(activity: ActivitySummary) {
  return activity.today.pray + activity.today.study + activity.today.record;
}

function recordResonanceLine(activity: ActivitySummary) {
  if ((activity.record_resonance ?? 0) <= 0) return "";
  const mood = (activity.last_record_input?.mood || "").trim();
  const lines: Record<string, string> = {
    calm: "아까 남긴 차분함이 아직 숨처럼 이어지고 있어.",
    tired: "아까 적어둔 피로가 천천히 가라앉는 중이야.",
    grateful: "남겨둔 고마움이 지금도 분위기를 밝히고 있어.",
    anxious: "아까의 불안을 같이 붙잡고 조금씩 풀어내는 중이야.",
    hopeful: "적어둔 기대가 지금의 걸음에 힘을 보태고 있어.",
  };
  return lines[mood] ?? "남겨둔 마음의 잔향이 아직 곁에 있어.";
}

function recordMoodTone(mood?: string | null) {
  const map: Record<string, string> = {
    tired: "조금 지친 마음",
    calm: "차분한 마음",
    grateful: "고마운 마음",
    anxious: "불안한 마음",
    hopeful: "기대하는 마음",
  };
  return map[(mood || "").trim()] ?? "오늘의 마음";
}

export function classifyFlow(activity: ActivitySummary) {
  const t = total(activity);
  const values = [activity.today.pray, activity.today.study, activity.today.record];
  if (t <= 1) return "잔잔형";
  if (Math.min(...values) >= 1 && Math.max(...values) - Math.min(...values) <= 1) return "균형형";
  if (activity.today.record >= 2 && (activity.record_input_count ?? 0) >= 1) return "관계형";
  if (activity.today.record >= 2) return "성찰형";
  if (activity.dominant_action === "study") return "전진형";
  if (activity.dominant_action === "record") return "정리형";
  if (activity.dominant_action === "pray") return "회복형";
  return "혼합형";
}

export function interpretDailyFlow(activity: ActivitySummary) {
  const t = total(activity);
  const first = activity.first_action?.action;
  const last = activity.last_action?.action;
  const dominant = activity.dominant_action;
  const flow = activity.flow_type ?? classifyFlow(activity);

  if (t === 0) return "많이 움직이지 않았지만, 멈춤에도 결이 있었어.";
  if (flow === "균형형") return "회복·전진·기억이 고르게 이어진 균형 있는 하루였어.";
  if (flow === "관계형" && activity.last_record_input) return "남긴 기록 덕분에 오늘의 마음이 더 또렷해졌어.";
  if (flow === "정리형" && activity.last_record_input) return "오늘은 남긴 기록으로 마음의 결을 정리한 하루였어.";
  if (first === "record") return "기록으로 하루를 열었네. 오늘은 안쪽에서 시작되는 날 같아.";
  if (last === "study") return "공부로 하루를 마무리했네. 앞으로 가려는 마음이 남아 있어.";
  if (dominant === "pray") return "기도가 하루의 중심이었어. 조용한 집중이 오래 남아.";
  if (dominant === "study") return "오늘은 전진의 흐름이 분명했어.";
  if (dominant === "record") return "오늘은 마음을 남기며 관계를 쌓는 쪽에 가까웠어.";
  return "작은 행동들이 이어지며 하루의 결을 만들었어.";
}

export function buildMoodSummary(pet: Pet, activity: ActivitySummary) {
  const t = total(activity);
  if (pet.hp <= 20 && pet.mood >= 70) return "몸은 지쳤지만 마음은 아직 밝아.";
  if (pet.hp <= 35 && pet.bond >= 65) return "지쳤지만 서로 곁에 머무는 감각이 있어.";
  if (pet.mood >= 70 && pet.growth >= 60) return "기분과 성장이 함께 오르는 좋은 흐름이야.";
  if (activity.today.record > 0 && t <= 1) return "적게 움직였어도 깊게 남긴 날이야.";
  if (pet.bond >= 70 && activity.today.record >= 2) return "관계와 기억이 함께 쌓이는 중이야.";
  if (activity.last_action?.action === "study" && pet.hp <= 45) return "조금 지쳤지만 멈추지 않으려는 의지가 보여.";
  return "오늘의 움직임이 천천히 너와 나를 바꾸고 있어.";
}

export function buildShortReaction(activity: ActivitySummary, moodSummary: string) {
  const t = activity.total_actions ?? total(activity);
  const last = activity.last_action?.action;
  const flow = activity.flow_type ?? classifyFlow(activity);

  if (t === 0) return "오늘은 멈춤의 결이 있어.";
  if (flow === "균형형") return "오늘은 리듬이 좋아.";
  if ((flow === "관계형" || flow === "성찰형" || flow === "정리형") && activity.last_record_input) {
    const r = recordResonanceLine(activity);
    if (r) return r;
    return "남겨준 말을 기억하고 있어.";
  }
  if (last === "pray") return "마음이 조금 맑아졌어.";
  if (last === "study") return "한 걸음 앞으로 간 느낌이야.";
  if (last === "record") return "오늘을 잊지 않을게.";

  const shortMap: Record<string, string> = {
    "지쳤지만 서로 곁에 머무는 감각이 있어.": "지쳐도 곁에 있어.",
    "기분과 성장이 함께 오르는 좋은 흐름이야.": "지금 흐름이 좋아.",
    "적게 움직였어도 깊게 남긴 날이야.": "적게 움직여도 깊었어.",
    "관계와 기억이 함께 쌓이는 중이야.": "관계가 쌓이고 있어.",
  };
  return shortMap[moodSummary] ?? "오늘의 결이 남아 있어.";
}

export function buildRelationalMemory(
  action: ActionType,
  pet: Pet,
  activity: ActivitySummary,
  context?: { synergy?: string | null; repeatPenalty?: number; recordText?: string | null; recordMood?: string | null },
) {
  const t = total(activity);
  const first = activity.first_action?.action;

  const baseTemplates = {
    pray: ["오늘의 기도는 습관보다 진심에 가까웠어.", "너는 잠깐 멈춰서 마음의 방향을 다시 맞췄어."],
    study: ["오늘의 공부는 서두름보다 의지에 가까웠어.", "너는 흔들려도 앞으로 가는 쪽을 골랐어."],
    record: ["너는 오늘, 마음의 흔적을 내게 남겼어.", "나는 네가 먼저 마음을 적어둔 장면을 기억할 거야."],
  };

  const synergyLines: Record<string, string> = {
    "pray->study": "마음을 다잡고 전진으로 이어진 흐름이었어.",
    "study->record": "전진이 그냥 지나가지 않고 기억으로 남았어.",
    "pray->record": "안쪽을 돌본 뒤 관계를 더 깊게 남겼어.",
  };

  let sequence = "";
  if (action === "record" && ((context?.recordText || "").trim() || context?.recordMood)) {
    if ((context?.recordText || "").trim()) {
      const snippet = (context?.recordText || "").trim().slice(0, 24);
      sequence = `네가 남긴 '${snippet}'라는 말을 나는 오래 기억할 것 같아.`;
    } else {
      sequence = `네가 남긴 ${recordMoodTone(context?.recordMood)}을 내가 받아 적어둘게.`;
    }
  } else if (context?.synergy && synergyLines[context.synergy]) {
    sequence = synergyLines[context.synergy];
  } else if (first === "record" && action !== "record") {
    sequence = "기록으로 시작한 하루라서, 지금의 행동도 더 또렷하게 느껴져.";
  } else if (t <= 2) {
    sequence = "움직임은 많지 않았지만, 남긴 장면은 선명했어.";
  } else if (activity.last_action?.action === "study") {
    sequence = "끝까지 전진 쪽으로 기울어 있던 하루였어.";
  }

  if ((context?.repeatPenalty ?? 0) > 0) sequence = "같은 리듬이 반복돼서 결이 조금 옅어졌어.";
  if (action !== "record" && !sequence) sequence = recordResonanceLine(activity);

  const base = baseTemplates[action][Math.floor(Math.random() * baseTemplates[action].length)];
  return `${base} ${sequence && Math.random() < 0.8 ? sequence : buildMoodSummary(pet, activity)}`;
}

export function buildThreeLineReport(pet: Pet, activity: ActivitySummary) {
  const t = total(activity);
  const counts = activity.today;
  const flow = activity.flow_type ?? classifyFlow(activity);
  const recordMood = activity.last_record_input?.mood ?? null;

  const line1 = interpretDailyFlow(activity);
  const line2 =
    recordMood === "tired"
      ? "나는 오늘, 지친 마음을 함께 받쳐주는 법을 배웠어."
      : recordMood === "calm"
      ? "나는 오늘, 잔잔한 마음을 오래 유지하는 법을 배웠어."
      : recordMood === "grateful"
      ? "나는 오늘, 고마움을 기억으로 보관하는 법을 배웠어."
      : recordMood === "anxious"
      ? "나는 오늘, 불안을 급히 밀어내지 않고 옆에 두는 법을 배웠어."
      : recordMood === "hopeful"
      ? "나는 오늘, 기대를 작은 전진으로 바꾸는 법을 배웠어."
      : flow === "균형형"
      ? "나는 오늘, 회복과 전진과 기억을 함께 배우는 중이었어."
      : pet.growth >= 70 || pet.level >= 3
      ? "나는 오늘, 자라는 속도를 스스로 감지하기 시작했어."
      : pet.bond >= 65
      ? "나는 오늘, 네 리듬에 맞춰 머무는 법을 조금 더 배웠어."
      : "나는 오늘, 네 흐름을 더 조용히 읽는 법을 연습했어.";

  const line3 =
    t === 0
      ? "내일은 아주 작은 행동 하나만 남겨도 충분해."
      : activity.last_record_input && (activity.last_record_input.text || activity.last_record_input.mood)
      ? recordMood === "tired"
        ? "내일은 쉬는 기도 한 번으로 몸부터 가볍게 해보자."
        : recordMood === "calm"
        ? "내일은 이 잔잔함을 지키며 한 걸음만 더 나아가 보자."
        : recordMood === "grateful"
        ? "내일은 고마운 마음을 행동 하나로 이어보자."
        : recordMood === "anxious"
        ? "내일은 불안을 줄이는 짧은 기록 한 줄을 먼저 남겨줘."
        : recordMood === "hopeful"
        ? "내일은 기대를 현실로 만드는 작은 공부 하나를 해보자."
        : "내일도 짧게라도 마음 한 줄을 남겨줘. 그게 우리를 더 선명하게 해."
      : counts.study >= 2 && counts.pray === 0
      ? "내일은 짧은 기도로 체력을 채우고 다시 전진해보자."
      : counts.record > 0 && t <= 2
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
  const flow_type = activity.flow_type ?? classifyFlow(activity);
  const enriched = { ...activity, flow_type };
  const mood_summary = buildMoodSummary(pet, enriched);
  const today_interpretation = interpretDailyFlow(enriched);
  const full_report = buildThreeLineReport(pet, enriched);
  const short_reaction = buildShortReaction(enriched, mood_summary);

  return {
    flow_type,
    short_reaction,
    room_bubble: short_reaction,
    interpretation_summary: today_interpretation.split(".")[0] + (today_interpretation.includes(".") ? "." : ""),
    mood_summary,
    today_interpretation,
    memory_highlight: message ?? memories[0]?.text ?? "오늘의 기억이 아직 없어.",
    daily_report: full_report,
    full_report,
  };
}
