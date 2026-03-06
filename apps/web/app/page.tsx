"use client";

import { useEffect, useMemo, useState } from "react";

type Pet = {
  id: number;
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

function applyGrowthProgression(pet: Pet): Pet {
  const next = { ...pet };
  while (next.growth >= 100) {
    next.level += 1;
    next.growth -= 100;
  }
  next.stage = next.level >= 3 ? 2 : 1;
  return next;
}

function applyLocalAction(pet: Pet, action: ActionType) {
  let next = { ...pet };
  let message = "";
  if (action === "pray") {
    next.mood = clamp(next.mood + 6);
    next.bond = clamp(next.bond + 4);
    next.growth = clamp(next.growth + 2);
    message = "기도했네. 마음이 차분해졌어.";
  } else if (action === "study") {
    next.hp = clamp(next.hp - 2);
    next.growth = clamp(next.growth + 7);
    next.bond = clamp(next.bond + 2);
    message = "공부 완료! 하늘이의 의지가 자랐어.";
  } else {
    next.mood = clamp(next.mood + 3);
    next.bond = clamp(next.bond + 5);
    next.growth = clamp(next.growth + 4);
    message = "기록을 남겼어. 하늘이가 오늘을 기억할게.";
  }
  next = applyGrowthProgression(next);
  return { next, message };
}

export default function HomePage() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [message, setMessage] = useState("하늘이를 깨워보자.");
  const [memories, setMemories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  const characterImage = useMemo(() => {
    if (!pet) return "./pets/sky/stage1.svg";
    return pet.stage >= 2 ? "./pets/sky/stage2.svg" : "./pets/sky/stage1.svg";
  }, [pet]);

  const loadPet = async () => {
    try {
      const res = await fetch(`${API_BASE}/pet/me`, { cache: "no-store" });
      if (res.status === 404) {
        const created = await fetch(`${API_BASE}/pet/create`, { method: "POST" });
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
      const localPet = JSON.parse(localStorage.getItem("skyling_pet") || "null") as Pet | null;
      const localMemories = JSON.parse(localStorage.getItem("skyling_memories") || "[]") as string[];
      setPet(localPet ?? DEFAULT_PET);
      setMemories(localMemories);
      setMessage("Mock 모드로 실행 중이야. (백엔드 없이 시각화 가능)");
    }
  };

  useEffect(() => {
    loadPet();
  }, []);

  const runAction = async (action: ActionType) => {
    if (!pet) return;
    setLoading(true);
    try {
      if (!mockMode) {
        const res = await fetch(`${API_BASE}/pet/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) throw new Error("action failed");
        const data = await res.json();
        setPet(data.pet);
        setMessage(data.message);
        setMemories(data.memories ?? []);
        return;
      }

      const { next, message } = applyLocalAction(pet, action);
      const nextMemories = [message, ...memories].slice(0, 3);
      setPet(next);
      setMessage(message);
      setMemories(nextMemories);
      localStorage.setItem("skyling_pet", JSON.stringify(next));
      localStorage.setItem("skyling_memories", JSON.stringify(nextMemories));
    } finally {
      setLoading(false);
    }
  };

  const statBar = (label: string, value: number) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="h-2 rounded bg-slate-700">
        <div className="h-2 rounded bg-sky-400" style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-md p-4">
      <h1 className="mb-3 text-2xl font-bold">하늘이와 나</h1>

      <section className="mb-3 rounded-xl bg-slate-800 p-4">
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-600 bg-slate-900">
          <img src={characterImage} alt="하늘이" className="h-44 w-full object-cover" />
        </div>
        <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
          <span>{pet?.name ?? "하늘이"}</span>
          <span>Lv {pet?.level ?? 1} · Stage {pet?.stage ?? 1}</span>
        </div>
        <p className="text-sm text-sky-300">{message}</p>
        {mockMode ? <p className="mt-1 text-xs text-amber-300">API 미연결: 로컬 Mock 모드</p> : null}
      </section>

      <section className="mb-3 space-y-3 rounded-xl bg-slate-800 p-4">
        {statBar("체력", pet?.hp ?? 0)}
        {statBar("기분", pet?.mood ?? 0)}
        {statBar("친밀도", pet?.bond ?? 0)}
        {statBar("성장도", pet?.growth ?? 0)}
      </section>

      <section className="mb-3 grid grid-cols-3 gap-2">
        <button className="rounded-lg bg-sky-600 p-3 text-sm font-semibold disabled:opacity-50" disabled={loading} onClick={() => runAction("pray")}>기도하기</button>
        <button className="rounded-lg bg-indigo-600 p-3 text-sm font-semibold disabled:opacity-50" disabled={loading} onClick={() => runAction("study")}>공부하기</button>
        <button className="rounded-lg bg-amber-600 p-3 text-sm font-semibold disabled:opacity-50" disabled={loading} onClick={() => runAction("record")}>기록하기</button>
      </section>

      <section className="rounded-xl bg-slate-800 p-4">
        <h2 className="mb-2 text-sm font-semibold">최근 기억</h2>
        <ul className="space-y-2 text-sm text-slate-200">
          {memories.length === 0 ? (
            <li className="rounded-lg bg-slate-700/60 px-3 py-2">아직 남은 기억이 없어.</li>
          ) : (
            memories.map((m, idx) => (
              <li key={idx} className="rounded-lg bg-slate-700/60 px-3 py-2">
                {m}
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
