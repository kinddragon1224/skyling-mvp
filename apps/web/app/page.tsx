"use client";

import { useEffect, useState } from "react";
import ActionButtons from "./components/ActionButtons";
import DailyLoopPanel from "./components/DailyLoopPanel";
import DailyReportPanel from "./components/DailyReportPanel";
import GameHeader from "./components/GameHeader";
import InterpretationPanel from "./components/InterpretationPanel";
import MemoryCards, { MemoryItem } from "./components/MemoryCards";
import PetRoom from "./components/PetRoom";
import PetStatusPanel from "./components/PetStatusPanel";

type Pet = {
  id: number;
  guest_id?: string;
  name: string;
  hp: number;
  mood: number;
  bond: number;
  growth: number;
  level: number;
  stage: number;
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

type Interpretation = {
  today: string;
  state: string;
};

type ApiResponse = {
  pet: Pet;
  message?: string;
  memories: MemoryItem[];
  activity?: ActivitySummary;
  interpretation?: Interpretation;
  daily_report?: string[];
};

type ActionType = "pray" | "study" | "record";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const GUEST_ID_KEY = "skyling_guest_id";
const MOCK_PET_KEY = "skyling_mock_pet";
const MOCK_MEMORIES_KEY = "skyling_mock_memories";
const MOCK_ACTIVITY_KEY = "skyling_mock_activity";

const DEFAULT_PET: Pet = {
  id: 1,
  name: "하늘이",
  hp: 50,
  mood: 50,
  bond: 30,
  growth: 10,
  level: 1,
  stage: 1,
};

const DEFAULT_ACTIVITY: ActivitySummary = {
  today: { pray: 0, study: 0, record: 0 },
  last_action: null,
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

function interpretToday(activity: ActivitySummary) {
  const counts = activity.today;
  const total = counts.pray + counts.study + counts.record;
  if (total === 0) return "오늘은 멈춤에 가까운 날이야. 쉬어도 괜찮아.";
  if (counts.study >= counts.pray && counts.study >= counts.record) return "오늘은 앞으로 나아가려는 기운이 보여.";
  if (counts.record >= counts.pray && counts.record >= counts.study) return "오늘은 마음을 남기고 관계를 쌓는 날 같아.";
  return "오늘은 조용히 머물며 중심을 잡는 날이야.";
}

function interpretState(pet: Pet, activity: ActivitySummary) {
  const total = activity.today.pray + activity.today.study + activity.today.record;
  if (pet.hp <= 35 && pet.bond >= 65) return "지쳤지만 서로 곁에 머무는 감각이 있어.";
  if (pet.mood >= 70 && pet.growth >= 60) return "기분과 성장이 함께 오르는 좋은 흐름이야.";
  if (pet.growth >= 70 && total <= 1) return "적게 움직였어도 깊게 남긴 하루였어.";
  if (pet.bond >= 70 && activity.today.record >= 2) return "기억을 쌓으며 관계가 단단해지고 있어.";
  return "오늘의 움직임이 조금씩 너와 나를 바꾸고 있어.";
}

function buildDailyReport(pet: Pet, activity: ActivitySummary): string[] {
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

function buildMemoryText(action: ActionType, pet: Pet, activity: ActivitySummary) {
  const choices = {
    pray: ["오늘 넌 숨을 고르고 마음을 가다듬었어.", "짧은 기도였지만 내 안엔 오래 남았어."],
    study: ["오늘의 공부는 서두름보다 의지에 가까웠어.", "넌 한 걸음씩 앞으로 가는 법을 선택했어."],
    record: ["오늘 넌 마음의 흔적을 내게 맡겼어.", "남겨둔 문장들이 우리 사이를 채우고 있어."],
  };
  const base = choices[action][Math.floor(Math.random() * choices[action].length)];
  return `${base} ${Math.random() < 0.5 ? interpretToday(activity) : interpretState(pet, activity)}`;
}

function getGuestId() {
  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `guest-${crypto.randomUUID()}`
      : `guest-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  localStorage.setItem(GUEST_ID_KEY, generated);
  return generated;
}

function applyGrowthProgression(pet: Pet): Pet {
  const next = { ...pet };
  while (next.growth >= 100) {
    next.level += 1;
    next.growth -= 100;
  }
  next.stage = next.level >= 3 ? 2 : 1;
  return next;
}

function computePresenceLine(pet: Pet | null) {
  if (!pet) return "하늘이가 네 쪽을 바라보고 있어.";
  if (pet.mood >= 75 && pet.hp >= 55) return "오늘은 조금 맑아 보여.";
  if (pet.bond >= 70) return "하늘이가 네 기록을 기다리고 있어.";
  if (pet.hp <= 35) return "지금은 쉬어가도 괜찮아.";
  if (pet.growth >= 70) return "꽤 멀리 왔어. 하늘이가 전진하고 있어.";
  return "작은 행동 하나면 오늘의 하늘이 달라져.";
}

export default function HomePage() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [message, setMessage] = useState("하늘이를 깨워보자.");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activity, setActivity] = useState<ActivitySummary>(DEFAULT_ACTIVITY);
  const [interpretation, setInterpretation] = useState<Interpretation>({
    today: "오늘은 멈춤에 가까운 날이야. 쉬어도 괜찮아.",
    state: "오늘의 움직임이 조금씩 너와 나를 바꾸고 있어.",
  });
  const [dailyReport, setDailyReport] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [showStageCongrats, setShowStageCongrats] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStageEvent, setShowStageEvent] = useState(false);

  const applyResponse = (data: ApiResponse) => {
    const prevLevel = pet?.level ?? data.pet.level;
    const prevStage = pet?.stage ?? data.pet.stage;

    const nextActivity = data.activity ?? DEFAULT_ACTIVITY;
    const nextInterpretation =
      data.interpretation ?? {
        today: interpretToday(nextActivity),
        state: interpretState(data.pet, nextActivity),
      };

    setPet(data.pet);
    setMemories(data.memories ?? []);
    setActivity(nextActivity);
    setInterpretation(nextInterpretation);
    setDailyReport(data.daily_report ?? buildDailyReport(data.pet, nextActivity));

    if (data.pet.level > prevLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2400);
    }

    if (data.pet.stage > prevStage) {
      setShowStageEvent(true);
      setTimeout(() => setShowStageEvent(false), 2600);
    }
  };

  useEffect(() => {
    if (!pet || pet.stage < 2) return;
    const key = `skyling_stage2_seen_${pet.id}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      setShowStageCongrats(true);
      localStorage.setItem(key, "1");
    }
  }, [pet]);

  const loadPet = async () => {
    const guestId = getGuestId();
    try {
      const res = await fetch(`${API_BASE}/pet/me?guest_id=${encodeURIComponent(guestId)}`, { cache: "no-store" });
      if (res.status === 404) {
        const created = await fetch(`${API_BASE}/pet/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guest_id: guestId }),
        });
        const data = (await created.json()) as ApiResponse;
        if (data.message) setMessage(data.message);
        applyResponse(data);
        return;
      }
      if (!res.ok) throw new Error("api error");
      const data = (await res.json()) as ApiResponse;
      applyResponse(data);
      setMockMode(false);
    } catch {
      setMockMode(true);
      const localPet = JSON.parse(localStorage.getItem(MOCK_PET_KEY) || "null") as Pet | null;
      const localMemories = JSON.parse(localStorage.getItem(MOCK_MEMORIES_KEY) || "[]") as MemoryItem[];
      const localActivity = JSON.parse(localStorage.getItem(MOCK_ACTIVITY_KEY) || "null") as ActivitySummary | null;
      const nextPet = localPet ?? DEFAULT_PET;
      const nextActivity = localActivity ?? DEFAULT_ACTIVITY;
      setPet(nextPet);
      setMemories(localMemories);
      setActivity(nextActivity);
      setInterpretation({ today: interpretToday(nextActivity), state: interpretState(nextPet, nextActivity) });
      setDailyReport(buildDailyReport(nextPet, nextActivity));
      setMessage("하늘이를 깨워보자.");
    }
  };

  useEffect(() => {
    loadPet();
  }, []);

  const runAction = async (action: ActionType) => {
    if (!pet) return;
    setLoading(true);
    try {
      const guestId = getGuestId();
      if (!mockMode) {
        const res = await fetch(`${API_BASE}/pet/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, guest_id: guestId }),
        });
        if (!res.ok) throw new Error("action failed");
        const data = (await res.json()) as ApiResponse;
        if (data.message) setMessage(data.message);
        applyResponse(data);
        return;
      }

      const next = { ...pet };
      if (action === "pray") {
        next.mood = clamp(next.mood + 6);
        next.bond = clamp(next.bond + 4);
        next.growth = clamp(next.growth + 2);
      } else if (action === "study") {
        next.hp = clamp(next.hp - 2);
        next.growth = clamp(next.growth + 7);
        next.bond = clamp(next.bond + 2);
      } else {
        next.mood = clamp(next.mood + 3);
        next.bond = clamp(next.bond + 5);
        next.growth = clamp(next.growth + 4);
      }
      const progressed = applyGrowthProgression(next);

      const nextActivity: ActivitySummary = {
        today: {
          ...activity.today,
          [action]: activity.today[action] + 1,
        },
        last_action: { action, created_at: new Date().toISOString() },
      };

      const message = buildMemoryText(action, progressed, nextActivity);
      const nextMemories = [{ text: message, action, created_at: new Date().toISOString() }, ...memories].slice(0, 3);

      if (progressed.level > pet.level) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 2400);
      }
      if (progressed.stage > pet.stage) {
        setShowStageEvent(true);
        setTimeout(() => setShowStageEvent(false), 2600);
      }

      setPet(progressed);
      setMessage(message);
      setMemories(nextMemories);
      setActivity(nextActivity);
      setInterpretation({ today: interpretToday(nextActivity), state: interpretState(progressed, nextActivity) });
      setDailyReport(buildDailyReport(progressed, nextActivity));

      localStorage.setItem(MOCK_PET_KEY, JSON.stringify(progressed));
      localStorage.setItem(MOCK_MEMORIES_KEY, JSON.stringify(nextMemories));
      localStorage.setItem(MOCK_ACTIVITY_KEY, JSON.stringify(nextActivity));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-3 pb-6">
      <div className="rounded-[28px] border border-sky-200/20 bg-gradient-to-b from-[#12254d]/95 to-[#0b1835]/95 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.6)]">
        <GameHeader />

        <PetRoom
          petName={pet?.name ?? "하늘이"}
          level={pet?.level ?? 1}
          stage={pet?.stage ?? 1}
          hp={pet?.hp ?? 50}
          mood={pet?.mood ?? 50}
          bond={pet?.bond ?? 30}
          message={message}
          presence={computePresenceLine(pet)}
          mockMode={mockMode}
          showStageCongrats={showStageCongrats}
        />

        <DailyLoopPanel
          activity={activity}
          todayMemory={memories[0]?.text}
          levelUp={showLevelUp}
          stageEvent={showStageEvent || (pet?.stage ?? 1) >= 2}
        />

        <InterpretationPanel interpretation={interpretation} />
        <DailyReportPanel report={dailyReport} />

        <PetStatusPanel pet={pet} />
        <ActionButtons loading={loading} onAction={runAction} />
        <MemoryCards memories={memories} />
      </div>
    </main>
  );
}
