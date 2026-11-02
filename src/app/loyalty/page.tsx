"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { tanggal } from "@/lib/format";

type Reward = { id: number; name: string; description: string; pointsCost: number; emoji: string; stock: number };
type Level = { name: string; emoji: string; next: number | null; min: number };
type LoyaltyData = {
  user: { id: number; name: string; points: number; totalSpent: number; level: Level } | null;
  leaderboard: { name: string; points: number; totalSpent: number }[];
  history: { id: number; delta: number; reason: string; createdAt: string }[];
  redemptions: { id: number; rewardName: string; pointsCost: number; code: string; status: string; createdAt: string }[];
  badges: { id: string; emoji: string; name: string; desc: string; earned: boolean }[];
  stats?: { orderCount: number; days: number; best: number; plays: number };
};

const LEVELS = [
  { name: "Pemula Hangat", emoji: "🌱", min: 0 },
  { name: "Sahabat Rempah", emoji: "🌿", min: 100 },
  { name: "Pendekar Wedang", emoji: "⚔️", min: 300 },
  { name: "Juragan Jahe", emoji: "🔥", min: 800 },
  { name: "Sultan Rempah", emoji: "👑", min: 2000 },
];

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [tab, setTab] = useState<"hadiah" | "badge" | "riwayat">("hadiah");

  const load = () => {
    fetch("/api/loyalty").then((r) => r.json()).then(setData);
    fetch("/api/rewards").then((r) => r.json()).then((d) => setRewards(d.rewards ?? []));
  };
  useEffect(load, []);

  async function redeem(r: Reward) {
    if (!confirm(`Tukar ${r.pointsCost} poin dengan ${r.name}?`)) return;
    setBusy(r.id);
    setMsg(null);
    const res = await fetch("/api/rewards/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rewardId: r.id }) });
    const d = await res.json();
    setBusy(null);
    if (!res.ok) setMsg({ ok: false, text: d.error });
    else {
      setMsg({ ok: true, text: `🎉 Berhasil! Tunjukkan kode ${d.redemption.code} ke Mas Ben.` });
      load();
    }
  }

  const user = data?.user;
  const score = user ? user.points + Math.floor(user.totalSpent / 1000) : 0;
  const lvl = user?.level;
  const pct = lvl ? (lvl.next ? Math.min(100, ((score - lvl.min) / (lvl.next - lvl.min)) * 100) : 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-300">Loyalty & Gamification</p>
        <h1 className="text-3xl md:text-5xl font-black mt-2">
          Poin, Level & <span className="neon-text">Hadiah</span>
        </h1>
      </div>

      {/* Member card */}
      {user ? (
        <div className="glass-strong p-6 md:p-8 relative overflow-hidden pulse-glow">
          <div className="absolute -right-10 -top-10 text-[200px] opacity-10 select-none">{lvl?.emoji}</div>
          <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">Kartu Member</div>
              <div className="text-2xl md:text-3xl font-black mt-1">{user.name}</div>
              <div className="chip !cursor-default mt-2 text-amber-200">{lvl?.emoji} {lvl?.name}</div>
              <div className="mt-4 max-w-md">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Progres level</span>
                  <span>{lvl?.next ? `${score} / ${lvl.next} XP` : "Level maksimal 👑"}</span>
                </div>
                <div className="progress"><div style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                {LEVELS.map((l) => (
                  <span key={l.name} className={`text-[10px] px-2 py-1 rounded-full border ${score >= l.min ? "bg-amber-400/20 border-amber-300/40 text-amber-100" : "border-white/10 text-white/40"}`}>
                    {l.emoji} {l.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-center glass p-6 min-w-[180px]">
              <div className="text-xs text-white/50 uppercase">Poin kamu</div>
              <div className="text-5xl font-black neon-text">{user.points}</div>
              <div className="text-xs text-white/50 mt-1">≈ Rp{(user.points * 100).toLocaleString("id-ID")} potongan</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-strong p-8 text-center">
          <div className="text-5xl">⭐</div>
          <h2 className="text-xl font-black mt-2">Gabung program loyalitas</h2>
          <p className="text-white/60 text-sm mt-1">Daftar sekarang, dapat 25 poin bonus. 1 poin tiap belanja Rp1.000.</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href="/register" className="btn-primary">Daftar</Link>
            <Link href="/login" className="btn-ghost">Masuk</Link>
          </div>
        </div>
      )}

      {/* How to earn */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["🛒", "Belanja", "1 poin / Rp1.000"],
          ["🎁", "Belanja ≥ Rp50.000", "Bonus +10 poin"],
          ["🎮", "Main game anak", "+5 poin / hari (skor ≥100)"],
          ["📝", "Daftar akun", "+25 poin bonus"],
        ].map(([e, t, d]) => (
          <div key={t} className="glass p-4 flex gap-3 items-center">
            <span className="text-3xl">{e}</span>
            <div><div className="font-bold text-sm">{t}</div><div className="text-xs text-white/60">{d}</div></div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-center">
        {(["hadiah", "badge", "riwayat"] as const).map((t) => (
          <button key={t} className={`chip ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "hadiah" ? "🎁 Tukar Hadiah" : t === "badge" ? "🏅 Lencana" : "📜 Riwayat"}
          </button>
        ))}
      </div>

      {msg && <div className={`glass p-4 text-center pop ${msg.ok ? "text-emerald-200" : "text-red-200"}`}>{msg.text}</div>}

      {tab === "hadiah" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((r) => {
            const can = !!user && user.points >= r.pointsCost && r.stock > 0;
            return (
              <div key={r.id} className="glass glass-hover p-5 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="text-5xl float-slow">{r.emoji}</div>
                  <div className="chip !cursor-default text-amber-200">⭐ {r.pointsCost}</div>
                </div>
                <h3 className="font-bold mt-3">{r.name}</h3>
                <p className="text-sm text-white/60 flex-1 mt-1">{r.description}</p>
                <div className="text-[10px] text-white/40 mt-2">Stok: {r.stock}</div>
                <button disabled={!can || busy === r.id} onClick={() => redeem(r)} className="btn-primary w-full mt-3 !py-2">
                  {!user ? "Masuk dulu" : r.stock <= 0 ? "Habis" : can ? "Tukar Sekarang" : `Kurang ${r.pointsCost - user.points} poin`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "badge" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(data?.badges ?? []).map((b) => (
            <div key={b.id} className={`glass p-5 text-center ${b.earned ? "border-amber-300/50 pulse-glow" : "opacity-50 grayscale"}`}>
              <div className="text-5xl">{b.emoji}</div>
              <div className="font-bold mt-2">{b.name}</div>
              <div className="text-xs text-white/60">{b.desc}</div>
              <div className={`text-[10px] mt-2 font-bold ${b.earned ? "text-emerald-300" : "text-white/40"}`}>{b.earned ? "✓ DIRAIH" : "TERKUNCI"}</div>
            </div>
          ))}
          {!user && <div className="col-span-full text-center text-white/50">Masuk untuk melihat lencanamu.</div>}
        </div>
      )}

      {tab === "riwayat" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass p-6">
            <h3 className="font-black mb-3">📜 Riwayat Poin</h3>
            {(data?.history ?? []).length === 0 && <p className="text-sm text-white/50">Belum ada riwayat.</p>}
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {(data?.history ?? []).map((h) => (
                <div key={h.id} className="flex justify-between text-sm glass !rounded-xl px-3 py-2">
                  <div><div>{h.reason}</div><div className="text-[10px] text-white/40">{tanggal(h.createdAt)}</div></div>
                  <div className={`font-black ${h.delta >= 0 ? "text-emerald-300" : "text-red-300"}`}>{h.delta >= 0 ? "+" : ""}{h.delta}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-6">
            <h3 className="font-black mb-3">🎟️ Voucher Hadiahku</h3>
            {(data?.redemptions ?? []).length === 0 && <p className="text-sm text-white/50">Belum ada penukaran.</p>}
            <div className="space-y-2">
              {(data?.redemptions ?? []).map((r) => (
                <div key={r.id} className="glass !rounded-xl px-4 py-3 flex justify-between items-center">
                  <div><div className="font-bold text-sm">{r.rewardName}</div><div className="text-[10px] text-white/40">{tanggal(r.createdAt)} · {r.pointsCost} poin</div></div>
                  <div className="font-mono font-black text-amber-300 text-lg">{r.code}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="glass-strong p-6">
        <h3 className="font-black text-xl">🏆 Papan Pelanggan Setia</h3>
        <div className="grid md:grid-cols-2 gap-2 mt-4">
          {(data?.leaderboard ?? []).map((l, i) => (
            <div key={i} className="flex items-center justify-between glass !rounded-xl px-4 py-2 text-sm">
              <span><span className="font-black text-amber-300 mr-2">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>{l.name}</span>
              <span className="font-bold">{l.points} ⭐</span>
            </div>
          ))}
          {(data?.leaderboard ?? []).length === 0 && <p className="text-sm text-white/50">Belum ada pelanggan terdaftar.</p>}
        </div>
      </div>
    </div>
  );
}
