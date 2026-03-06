"use client";

import { useEffect, useState } from "react";

type Pet = {
  id: number;
  name: string;
  hp: number;
  mood: number;
  bond: number;
  growth: number;
};

type ActionType = "pray" | "study" | "record";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export default function HomePage() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [message, setMessage] = useState("하늘이를 깨워보자.");
  const [memories, setMemories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPet = async () => {
    const res = await fetch(`${API_BASE}/pet/me`);
    if (res.status === 404) {
      const created = await fetch(`${API_BASE}/pet/create`, { method: "POST" });
      const data = await created.json();
      setPet(data.pet);
      setMessage(data.message);
      setMemories(data.memories ?? []);
      return;
    }
    const data = await res.json();
    setPet(data.pet);
    setMemories(data.memories ?? []);
  };

  useEffect(() => {
    loadPet().catch(() => setMessage("서버 연결에 실패했어."));
  }, []);

  const runAction = async (action: ActionType) => {
    if (!pet) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pet/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setPet(data.pet);
      setMessage(data.message);
      setMemories(data.memories ?? []);
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
        <div className="mb-3 flex h-44 items-center justify-center rounded-lg border border-dashed border-slate-500 bg-slate-900 text-slate-300">
          하늘이 캐릭터 영역
        </div>
        <p className="text-sm text-sky-300">{message}</p>
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
        <h2 className="mb-2 text-sm font-semibold">최근 기억 3개</h2>
        <ul className="list-disc space-y-1 pl-4 text-sm text-slate-200">
          {memories.length === 0 ? <li>아직 기억이 없어.</li> : memories.map((m, idx) => <li key={idx}>{m}</li>)}
        </ul>
      </section>
    </main>
  );
}
