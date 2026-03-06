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
import { buildInteractionSnapshot, buildRelationalMemory, InteractionSnapshot } from "./lib/interaction";

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
  today: { pray: number; study: number; record: number };
  total_actions?: number;
  dominant_action?: string | null;
  flow_type?: string;
  first_action?: { action: string; created_at: string } | null;
  last_action: { action: string; created_at: string } | null;
};

type ActionAvailability = {
  pray: { enabled: boolean; reason?: string | null };
  study: { enabled: boolean; reason?: string | null };
  record: { enabled: boolean; reason?: string | null };
};

type ApiResponse = {
  pet: Pet;
  message?: string;
  memories: MemoryItem[];
  activity?: ActivitySummary;
  interaction_snapshot?: InteractionSnapshot;
  action_availability?: ActionAvailability;
};

type ActionType = "pray" | "study" | "record";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const GUEST_ID_KEY = "skyling_guest_id";
const MOCK_PET_KEY = "skyling_mock_pet";
const MOCK_MEMORIES_KEY = "skyling_mock_memories";
const MOCK_ACTIVITY_KEY = "skyling_mock_activity";

const DEFAULT_PET: Pet = { id: 1, name: "하늘이", hp: 50, mood: 50, bond: 30, growth: 10, level: 1, stage: 1 };
const DEFAULT_ACTIVITY: ActivitySummary = { today: { pray: 0, study: 0, record: 0 }, flow_type: "잔잔형", last_action: null };
const DEFAULT_AVAILABILITY: ActionAvailability = {
  pray: { enabled: true },
  study: { enabled: true },
  record: { enabled: true },
};

const DEFAULT_SNAPSHOT: InteractionSnapshot = {
  short_reaction: "오늘은 멈춤의 결이 있어.",
  room_bubble: "오늘은 멈춤의 결이 있어.",
  interpretation_summary: "오늘은 멈춤에 가까운 날이야.",
  mood_summary: "오늘의 움직임이 조금씩 너와 나를 바꾸고 있어.",
  today_interpretation: "오늘은 멈춤에 가까운 날이야. 쉬어도 괜찮아.",
  memory_highlight: "오늘의 기억이 아직 없어.",
  daily_report: [
    "오늘은 멈춤에 가까운 날이야. 쉬어도 괜찮아.",
    "나는 오늘, 너의 리듬을 기억하는 법을 연습했어.",
    "내일은 아주 작은 행동 하나만 남겨줘도 충분해.",
  ],
  full_report: [
    "오늘은 멈춤에 가까운 날이야. 쉬어도 괜찮아.",
    "나는 오늘, 너의 리듬을 기억하는 법을 연습했어.",
    "내일은 아주 작은 행동 하나만 남겨줘도 충분해.",
  ],
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

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

export default function HomePage() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [message, setMessage] = useState("하늘이를 깨워보자.");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activity, setActivity] = useState<ActivitySummary>(DEFAULT_ACTIVITY);
  const [snapshot, setSnapshot] = useState<InteractionSnapshot>(DEFAULT_SNAPSHOT);
  const [availability, setAvailability] = useState<ActionAvailability>(DEFAULT_AVAILABILITY);
  const [loading, setLoading] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [showStageCongrats, setShowStageCongrats] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showStageEvent, setShowStageEvent] = useState(false);

  const applyResponse = (data: ApiResponse) => {
    const prevLevel = pet?.level ?? data.pet.level;
    const prevStage = pet?.stage ?? data.pet.stage;

    const nextActivity = data.activity ?? DEFAULT_ACTIVITY;
    const nextSnapshot = data.interaction_snapshot ?? buildInteractionSnapshot(data.pet, nextActivity, data.memories ?? [], data.message);

    setPet(data.pet);
    setMemories(data.memories ?? []);
    setActivity(nextActivity);
    setSnapshot(nextSnapshot);
    setAvailability(data.action_availability ?? {
      pray: { enabled: true },
      study: { enabled: data.pet.hp > 10, reason: data.pet.hp > 10 ? null : "체력이 부족해" },
      record: { enabled: true },
    });

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
      setSnapshot(buildInteractionSnapshot(nextPet, nextActivity, localMemories));
      setAvailability({
        pray: { enabled: true },
        study: { enabled: nextPet.hp > 10, reason: nextPet.hp > 10 ? null : "체력이 부족해" },
        record: { enabled: true },
      });
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
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "지금은 조금 쉬어야 해." }));
          setMessage(err.detail ?? "지금은 조금 쉬어야 해.");
          return;
        }
        const data = (await res.json()) as ApiResponse;
        if (data.message) setMessage(data.message);
        applyResponse(data);
        return;
      }

      const next = { ...pet };
      const lastAction = activity.last_action?.action ?? null;

      const recent = [activity.last_action?.action, activity.first_action?.action].filter(Boolean) as string[];
      let repeatStreak = 0;
      for (const a of recent) {
        if (a === action) repeatStreak += 1;
        else break;
      }

      let synergy: string | null = null;
      if (lastAction === "pray" && action === "study") synergy = "pray->study";
      else if (lastAction === "study" && action === "record") synergy = "study->record";
      else if (lastAction === "pray" && action === "record") synergy = "pray->record";

      if (action === "pray") {
        let recover = next.hp <= 40 ? 6 : 3;
        recover = Math.max(1, recover - repeatStreak);
        next.hp = clamp(next.hp + recover);
        next.mood = clamp(next.mood + 3);
        next.bond = clamp(next.bond + 2);
      } else if (action === "study") {
        if (next.hp <= 10) {
          setMessage("체력이 부족해. 지금은 조금 쉬어야 해.");
          setAvailability({
            pray: { enabled: true },
            study: { enabled: false, reason: "체력이 부족해" },
            record: { enabled: true },
          });
          return;
        }
        let growthGain = 5;
        let hpCost = 5;
        if (synergy === "pray->study") {
          growthGain += 2;
          hpCost = 4;
        }
        growthGain = Math.max(2, growthGain - Math.max(0, repeatStreak - 1));
        hpCost += Math.max(0, repeatStreak - 1);

        next.hp = clamp(next.hp - hpCost);
        next.growth = clamp(next.growth + growthGain);
        next.bond = clamp(next.bond + 1);
      } else {
        let bondGain = 5;
        let growthGain = 1;
        let moodGain = 2;
        if (synergy === "study->record") {
          bondGain += 1;
          moodGain += 1;
        }
        if (synergy === "pray->record") bondGain += 2;
        bondGain = Math.max(2, bondGain - Math.max(0, repeatStreak - 1));
        growthGain = Math.max(0, growthGain - Math.max(0, repeatStreak - 1));

        next.mood = clamp(next.mood + moodGain);
        next.bond = clamp(next.bond + bondGain);
        next.growth = clamp(next.growth + growthGain);
      }
      const progressed = applyGrowthProgression(next);

      const nextToday = { ...activity.today, [action]: activity.today[action] + 1 };
      const totalActions = nextToday.pray + nextToday.study + nextToday.record;
      const dominantAction = totalActions > 0 ? (Object.entries(nextToday).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) : null;
      const values = [nextToday.pray, nextToday.study, nextToday.record];
      const flowType =
        totalActions <= 1
          ? "잔잔형"
          : Math.min(...values) >= 1 && Math.max(...values) - Math.min(...values) <= 1
          ? "균형형"
          : dominantAction === "study"
          ? "전진형"
          : dominantAction === "record"
          ? "성찰형"
          : dominantAction === "pray"
          ? "회복형"
          : "혼합형";

      const nextActivity: ActivitySummary = {
        today: nextToday,
        total_actions: totalActions,
        dominant_action: dominantAction,
        flow_type: flowType,
        first_action: activity.first_action ?? { action, created_at: new Date().toISOString() },
        last_action: { action, created_at: new Date().toISOString() },
      };

      const nextMessage = buildRelationalMemory(action, progressed, nextActivity, {
        synergy,
        repeatPenalty: Math.max(0, repeatStreak - 1),
      });
      const nextMemories = [{ text: nextMessage, action, created_at: new Date().toISOString() }, ...memories].slice(0, 3);

      if (progressed.level > pet.level) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 2400);
      }
      if (progressed.stage > pet.stage) {
        setShowStageEvent(true);
        setTimeout(() => setShowStageEvent(false), 2600);
      }

      setPet(progressed);
      setMessage(nextMessage);
      setMemories(nextMemories);
      setActivity(nextActivity);
      setSnapshot(buildInteractionSnapshot(progressed, nextActivity, nextMemories, nextMessage));
      setAvailability({
        pray: { enabled: true },
        study: { enabled: progressed.hp > 10, reason: progressed.hp > 10 ? null : "체력이 부족해" },
        record: { enabled: true },
      });

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
          roomBubble={snapshot.room_bubble || snapshot.short_reaction}
          presence={snapshot.mood_summary}
          mockMode={mockMode}
          showStageCongrats={showStageCongrats}
        />

        <ActionButtons loading={loading} onAction={runAction} availability={availability} />
        <PetStatusPanel pet={pet} />

        <DailyLoopPanel
          activity={activity}
          todayMemory={snapshot.memory_highlight}
          flowType={snapshot.flow_type ?? activity.flow_type}
          levelUp={showLevelUp}
          stageEvent={showStageEvent || (pet?.stage ?? 1) >= 2}
        />

        <MemoryCards memories={memories} />
        <InterpretationPanel interpretation={{ today: snapshot.today_interpretation, state: snapshot.mood_summary, summary: snapshot.interpretation_summary }} />
        <DailyReportPanel report={snapshot.full_report ?? snapshot.daily_report} />
      </div>
    </main>
  );
}
