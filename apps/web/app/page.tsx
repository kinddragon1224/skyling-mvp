"use client";

import { useEffect, useMemo, useState } from "react";
import ActionButtons from "./components/ActionButtons";
import MemoryCards, { MemoryItem } from "./components/MemoryCards";
import StatBars from "./components/StatBars";

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
const BASE_PATH = process.env.NODE_ENV === "production" ? "/skyling-mvp" : "";
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

function withBasePath(path: string) {
  return `${BASE_PATH}${path}`;
}

function getPetImageCandidates(stage: number) {
  const stageName = stage >= 2 ? "stage2" : "stage1";
  return [
    withBasePath(`/pets/sky/${stageName}.svg`),
    withBasePath(`/pets/sky/${stageName}.png`),
  ];
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
  const [imageIndex, setImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showStageCongrats, setShowStageCongrats] = useState(false);

  const imageCandidates = useMemo(() => getPetImageCandidates(pet?.stage ?? 1), [pet]);

  useEffect(() => {
    setImageIndex(0);
    setImageLoaded(false);
  }, [imageCandidates]);

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
      const nextMemories = [
        { text: message, action, created_at: new Date().toISOString() },
        ...memories,
      ].slice(0, 3);
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
    <main className="mx-auto min-h-screen w-full max-w-md p-3 pb-5">
      <header className="mb-3 flex items-center justify-between rounded-2xl border-2 border-sky-200/60 bg-gradient-to-b from-sky-300 to-sky-500 px-3 py-2 shadow-[0_6px_0_rgba(14,51,95,0.6)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-base">☁️</div>
          <div>
            <p className="text-[10px] font-semibold text-sky-900/80">Skyling</p>
            <h1 className="text-base font-extrabold text-sky-950">하늘이와 나</h1>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="rounded-lg bg-sky-900/70 px-2 py-1 text-[11px] font-bold text-amber-100">🪙 0</span>
          <span className="rounded-lg bg-indigo-900/70 px-2 py-1 text-[11px] font-bold text-cyan-100">💎 0</span>
        </div>
      </header>

      <section className="mb-3 rounded-2xl border border-sky-200/30 bg-slate-900/50 p-3">
        <div className="mb-2 overflow-hidden rounded-xl border border-sky-200/30 bg-gradient-to-b from-sky-700 via-[#12335f] to-[#0c1d35] p-2">
          <div className="rounded-xl border border-cyan-200/20 bg-gradient-to-b from-white/10 to-transparent p-1">
            <div className="relative overflow-hidden rounded-lg border border-sky-100/20 bg-gradient-to-b from-sky-500/25 to-slate-950/40">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(186,230,253,0.3),transparent_55%)]" />
              <div className="pointer-events-none absolute bottom-0 h-10 w-full bg-gradient-to-t from-emerald-900/40 to-transparent" />
              {imageIndex < imageCandidates.length ? (
                <>
                  <img
                    src={imageCandidates[imageIndex]}
                    alt="하늘이"
                    className={`relative z-10 h-44 w-full object-contain transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageLoaded(false);
                      setImageIndex((v) => v + 1);
                    }}
                  />
                  {!imageLoaded ? (
                    <div className="absolute inset-0 z-20 flex h-44 items-center justify-center text-sm font-medium text-cyan-100">
                      하늘이 구름을 불러오는 중…
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-cyan-100">하늘 방에서 쉬는 중…</div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-1 flex items-center justify-between text-sm text-sky-100">
          <span>{pet?.name ?? "하늘이"}</span>
          <span>Lv.{pet?.level ?? 1} · Stage {pet?.stage ?? 1}</span>
        </div>
        <p className="text-sm text-cyan-200">{message}</p>
        <p className="mt-1 text-xs text-sky-100/80">{computePresenceLine(pet)}</p>
        {showStageCongrats ? (
          <p className="mt-2 rounded-lg bg-emerald-400/20 px-3 py-2 text-xs text-emerald-100">
            🎉 하늘이가 Stage 2로 진화했어!
          </p>
        ) : null}
        {mockMode ? <p className="mt-1 text-xs text-amber-200">Mock 모드로 실행 중이야. (백엔드 없이 시각화 가능)</p> : null}
      </section>

      <StatBars pet={pet} />
      <ActionButtons loading={loading} onAction={runAction} />
      <MemoryCards memories={memories} />
    </main>
  );
}
