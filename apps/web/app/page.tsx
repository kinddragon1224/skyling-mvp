"use client";

import { useEffect, useState } from "react";
import ActionButtons from "./components/ActionButtons";
import GameHeader from "./components/GameHeader";
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

type ActionType = "pray" | "study" | "record";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const GUEST_ID_KEY = "skyling_guest_id";
const MOCK_PET_KEY = "skyling_mock_pet";
const MOCK_MEMORIES_KEY = "skyling_mock_memories";

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

function localReaction(action: ActionType) {
  const templates = {
    pray: [
      "기도했네. 마음이 차분해졌어.",
      "숨이 고르게 정리됐어. 하늘이도 맑아졌어.",
      "조용히 기도했구나. 오늘의 공기가 조금 더 잔잔해.",
    ],
    study: [
      "공부 완료! 하늘이의 의지가 자랐어.",
      "한 걸음 전진했어. 하늘이도 같이 단단해졌어.",
      "집중한 시간이 쌓였어. 성장의 결이 선명해졌어.",
    ],
    record: [
      "기록을 남겼어. 하늘이가 오늘을 기억할게.",
      "짧은 기록도 소중해. 우리 기억이 또 하나 쌓였어.",
      "오늘의 흔적이 저장됐어. 함께 축적되고 있어.",
    ],
  };

  const choices = templates[action];
  if (Math.random() < 0.65) return choices[0];
  return choices[1 + Math.floor(Math.random() * (choices.length - 1))];
}

function applyLocalAction(pet: Pet, action: ActionType) {
  let next = { ...pet };
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
  next = applyGrowthProgression(next);
  return { next, message: localReaction(action) };
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
  const [loading, setLoading] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [showStageCongrats, setShowStageCongrats] = useState(false);

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
        const data = await created.json();
        setPet(data.pet);
        setMessage(data.message);
        setMemories(data.memories ?? []);
        return;
      }
      if (!res.ok) throw new Error("api error");
      const data = await res.json();
      setPet(data.pet);
      setMemories(data.memories ?? []);
      setMockMode(false);
    } catch {
      setMockMode(true);
      const localPet = JSON.parse(localStorage.getItem(MOCK_PET_KEY) || "null") as Pet | null;
      const localMemories = JSON.parse(localStorage.getItem(MOCK_MEMORIES_KEY) || "[]") as MemoryItem[];
      setPet(localPet ?? DEFAULT_PET);
      setMemories(localMemories);
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
        const data = await res.json();
        setPet(data.pet);
        setMessage(data.message);
        setMemories(data.memories ?? []);
        return;
      }

      const { next, message } = applyLocalAction(pet, action);
      const nextMemories = [{ text: message, action, created_at: new Date().toISOString() }, ...memories].slice(0, 3);
      setPet(next);
      setMessage(message);
      setMemories(nextMemories);
      localStorage.setItem(MOCK_PET_KEY, JSON.stringify(next));
      localStorage.setItem(MOCK_MEMORIES_KEY, JSON.stringify(nextMemories));
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

        <PetStatusPanel pet={pet} />
        <ActionButtons loading={loading} onAction={runAction} />
        <MemoryCards memories={memories} />
      </div>
    </main>
  );
}
