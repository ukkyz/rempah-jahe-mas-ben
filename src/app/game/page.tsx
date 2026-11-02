"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SPICES } from "@/data/spices";

const RECIPES = [
  { name: "Wedang Jahe", emoji: "🫚", ids: [1, 16] },
  { name: "Jahe Sereh Madu", emoji: "🍯", ids: [1, 6, 15] },
  { name: "Kunyit Asam", emoji: "🌼", ids: [3, 13, 14] },
  { name: "Beras Kencur", emoji: "🌾", ids: [5, 1, 16] },
  { name: "Wedang Uwuh", emoji: "🍂", ids: [10, 8, 7, 11, 1] },
  { name: "Bir Pletok", emoji: "🍹", ids: [1, 10, 7, 9, 18] },
  { name: "Temulawak Madu", emoji: "🌱", ids: [4, 15] },
  { name: "Jahe Susu", emoji: "🥛", ids: [1, 16, 17] },
  { name: "Recovery Shot", emoji: "⚡", ids: [3, 2, 12] },
  { name: "Sekoteng", emoji: "🥣", ids: [1, 11, 19, 16] },
];

const CUSTOMERS = ["👦 Adit", "👧 Sari", "👴 Mbah Karto", "👩 Bu Rini", "🧑‍🏫 Pak Guru", "🏸 Kak Jonatan", "⚽ Kak Rizky", "👵 Eyang Uti"];

type Phase = "intro" | "play" | "round-done" | "over";

function shuffle<T>(a: T[]) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GamePage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [recipe, setRecipe] = useState(RECIPES[0]);
  const [customer, setCustomer] = useState(CUSTOMERS[0]);
  const [pantry, setPantry] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [time, setTime] = useState(20);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [fact, setFact] = useState("");
  const [top, setTop] = useState<{ playerName: string; score: number; level: number }[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [saved, setSaved] = useState<{ bonus: number } | null>(null);
  const [floaters, setFloaters] = useState<{ id: number; text: string; x: number }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/game/score").then((r) => r.json()).then((d) => setTop(d.top ?? []));
    fetch("/api/auth/me").then((r) => r.json()).then((d) => d.user && setPlayerName(d.user.name));
  }, []);

  const startRound = useCallback(
    (lvl: number) => {
      const pool = RECIPES.filter((r) => r.ids.length <= Math.min(2 + lvl, 5));
      const r = pool[Math.floor(Math.random() * pool.length)];
      const distractCount = Math.min(4 + lvl, 10);
      const distractors = shuffle(SPICES.map((s) => s.id).filter((id) => !r.ids.includes(id))).slice(0, distractCount);
      setRecipe(r);
      setCustomer(CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]);
      setPantry(shuffle([...r.ids, ...distractors]));
      setPicked([]);
      setTime(Math.max(8, 22 - lvl * 2));
      setPhase("play");
    },
    []
  );

  useEffect(() => {
    if (phase !== "play") return;
    timerRef.current = setInterval(() => setTime((t) => t - 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && time <= 0) {
      loseLife("⏰ Waktu habis!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, phase]);

  function addFloater(text: string) {
    const id = Date.now() + Math.random();
    setFloaters((f) => [...f, { id, text, x: 20 + Math.random() * 60 }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 1000);
  }

  function loseLife(msg: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    addFloater(msg);
    setCombo(0);
    const next = lives - 1;
    setLives(next);
    if (next <= 0) {
      setPhase("over");
    } else {
      setFact(`Resep ${recipe.name}: ${recipe.ids.map((id) => SPICES.find((s) => s.id === id)?.name).join(", ")}. Coba lagi!`);
      setPhase("round-done");
    }
  }

  function pick(id: number) {
    if (phase !== "play") return;
    if (picked.includes(id)) return;
    if (recipe.ids.includes(id)) {
      const gained = 20 + combo * 5 + Math.max(0, time);
      setScore((s) => s + gained);
      setCombo((c) => c + 1);
      addFloater(`+${gained}`);
      const next = [...picked, id];
      setPicked(next);
      if (next.length === recipe.ids.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        const bonus = 50 * level;
        setScore((s) => s + bonus);
        const sp = SPICES.find((s) => s.id === recipe.ids[Math.floor(Math.random() * recipe.ids.length)])!;
        setFact(`🎉 ${recipe.name} siap! Bonus +${bonus}. Tahukah kamu? ${sp.name}: ${sp.benefits[0].toLowerCase()}.`);
        setPhase("round-done");
      }
    } else {
      setShakeId(id);
      setTimeout(() => setShakeId(null), 400);
      setScore((s) => Math.max(0, s - 10));
      setCombo(0);
      addFloater("-10 ❌");
      setTime((t) => Math.max(1, t - 3));
    }
  }

  function nextRound() {
    const lvl = lives > 0 && picked.length === recipe.ids.length ? level + 1 : level;
    setLevel(lvl);
    startRound(lvl);
  }

  function start() {
    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    setSaved(null);
    startRound(1);
  }

  async function saveScore() {
    const res = await fetch("/api/game/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, level, playerName: playerName || "Peracik Cilik" }),
    });
    const d = await res.json();
    setSaved({ bonus: d.bonus ?? 0 });
    fetch("/api/game/score").then((r) => r.json()).then((x) => setTop(x.top ?? []));
  }

  const progress = recipe.ids.length ? (picked.length / recipe.ids.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 space-y-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Game Edukasi Anak</p>
        <h1 className="text-3xl md:text-5xl font-black mt-2">
          🧪 Peracik <span className="neon-cyan">Rempah Cilik</span>
        </h1>
      </div>

      {phase === "intro" && (
        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div className="glass-strong p-8 pop">
            <div className="text-6xl float inline-block">👨‍🍳</div>
            <h2 className="text-2xl font-black mt-3">Bantu Mas Ben melayani pelanggan!</h2>
            <ol className="mt-4 space-y-2 text-white/80 text-sm list-decimal pl-5">
              <li>Pelanggan datang memesan wedang. Lihat <b>resep</b> rempah yang dibutuhkan.</li>
              <li>Ketuk rempah yang benar di rak sebelum <b>waktu habis</b>.</li>
              <li>Salah ambil rempah = skor berkurang & waktu terpotong. Hati-hati ya!</li>
              <li>Setiap racikan sukses naik level: resep makin panjang, waktu makin singkat.</li>
              <li>Kamu punya <b>3 nyawa ❤️</b>. Kumpulkan skor setinggi mungkin!</li>
            </ol>
            <input className="input mt-5" placeholder="Nama peracik cilik" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            <button onClick={start} className="btn-primary w-full mt-4 text-lg">🚀 Mulai Meracik!</button>
            <p className="text-xs text-white/50 mt-3 text-center">Pelanggan yang login & skor ≥100 dapat bonus 5 poin loyalty/hari 🎁</p>
          </div>
          <Leaderboard top={top} />
        </div>
      )}

      {(phase === "play" || phase === "round-done") && (
        <div className="space-y-5 relative">
          {floaters.map((f) => (
            <div key={f.id} className="fixed top-1/3 z-50 text-2xl font-black text-amber-300 pointer-events-none" style={{ left: `${f.x}%`, animation: "bubble 1s ease-out forwards" }}>
              {f.text}
            </div>
          ))}
          {/* HUD */}
          <div className="grid grid-cols-4 gap-3">
            <div className="glass p-3 text-center"><div className="text-[10px] text-white/50 uppercase">Skor</div><div className="text-2xl font-black neon-text" key={score}>{score}</div></div>
            <div className="glass p-3 text-center"><div className="text-[10px] text-white/50 uppercase">Level</div><div className="text-2xl font-black">{level}</div></div>
            <div className="glass p-3 text-center"><div className="text-[10px] text-white/50 uppercase">Nyawa</div><div className="text-2xl">{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</div></div>
            <div className={`glass p-3 text-center ${time <= 5 ? "border-red-400/60" : ""}`}><div className="text-[10px] text-white/50 uppercase">Waktu</div><div className={`text-2xl font-black ${time <= 5 ? "text-red-300 shake" : ""}`}>{time}s</div></div>
          </div>

          {/* Order card */}
          <div className="glass-strong p-6 flex flex-col md:flex-row gap-6 items-center">
            <div className="text-center">
              <div className="text-5xl">{customer.split(" ")[0]}</div>
              <div className="text-xs text-white/60 mt-1">{customer.split(" ").slice(1).join(" ")}</div>
            </div>
            <div className="flex-1 w-full">
              <div className="text-sm text-white/60">memesan:</div>
              <div className="text-2xl font-black">{recipe.emoji} {recipe.name}</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {recipe.ids.map((id) => {
                  const s = SPICES.find((x) => x.id === id)!;
                  const done = picked.includes(id);
                  return (
                    <span key={id} className={`chip !cursor-default transition-all ${done ? "active" : ""}`}>
                      {done ? "✅" : s.emoji} {s.name}
                    </span>
                  );
                })}
              </div>
              <div className="progress mt-3"><div style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="relative w-24 h-28 glass flex items-end justify-center overflow-hidden">
              <div className="absolute inset-x-2 bottom-2 rounded-xl bg-gradient-to-t from-orange-600/80 to-amber-300/70 transition-all duration-500" style={{ height: `${Math.max(8, progress * 0.85)}%` }} />
              {progress === 100 && <><span className="steam" style={{ left: "30%" }} /><span className="steam" style={{ left: "55%", animationDelay: "1s" }} /></>}
              <span className="relative text-3xl mb-3">{recipe.emoji}</span>
            </div>
          </div>

          {/* Pantry */}
          {phase === "play" && (
            <div>
              <div className="text-sm text-white/60 mb-2">🧺 Rak rempah — ketuk yang sesuai resep! {combo > 1 && <span className="text-amber-300 font-bold">🔥 Combo ×{combo}</span>}</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {pantry.map((id) => {
                  const s = SPICES.find((x) => x.id === id)!;
                  const done = picked.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => pick(id)}
                      disabled={done}
                      className={`glass glass-hover p-4 text-center ${done ? "opacity-30" : ""} ${shakeId === id ? "shake border-red-400" : ""}`}
                    >
                      <div className="text-4xl">{s.emoji}</div>
                      <div className="text-xs font-bold mt-1">{s.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {phase === "round-done" && (
            <div className="glass-strong p-6 text-center pop">
              <p className="text-white/90">{fact}</p>
              <button onClick={nextRound} className="btn-primary mt-4">
                {lives > 0 && picked.length === recipe.ids.length ? `Level ${level + 1} →` : "Coba Lagi →"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "over" && (
        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div className="glass-strong p-8 text-center pop">
            <div className="text-6xl">{score >= 500 ? "🏆" : score >= 200 ? "🥈" : "🍵"}</div>
            <h2 className="text-3xl font-black mt-3">Permainan Selesai!</h2>
            <div className="text-6xl font-black neon-text mt-2">{score}</div>
            <p className="text-white/60">poin · mencapai level {level}</p>
            <p className="mt-3 text-sm text-cyan-200">
              {score >= 500 ? "Luar biasa! Kamu Master Peracik Rempah! 🧪" : score >= 200 ? "Hebat! Sedikit lagi jadi master." : "Terus berlatih, peracik cilik!"}
            </p>
            {!saved ? (
              <div className="mt-5 space-y-3">
                <input className="input max-w-xs mx-auto" placeholder="Nama peracik cilik" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
                <div className="flex gap-3 justify-center">
                  <button onClick={saveScore} className="btn-primary">💾 Simpan Skor</button>
                  <button onClick={start} className="btn-ghost">🔁 Main Lagi</button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="glass p-3 inline-block">✅ Skor tersimpan! {saved.bonus > 0 && <span className="text-amber-300 font-bold">+{saved.bonus} poin loyalty 🎁</span>}</div>
                <div><button onClick={start} className="btn-primary">🔁 Main Lagi</button></div>
              </div>
            )}
          </div>
          <Leaderboard top={top} />
        </div>
      )}
    </div>
  );
}

function Leaderboard({ top }: { top: { playerName: string; score: number; level: number }[] }) {
  return (
    <div className="glass p-6">
      <h3 className="font-black text-lg">🏅 Papan Skor</h3>
      {top.length === 0 ? (
        <p className="text-sm text-white/50 mt-3">Belum ada skor. Jadilah yang pertama!</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {top.map((t, i) => (
            <li key={i} className="flex items-center justify-between text-sm glass !rounded-xl px-3 py-2">
              <span>
                <span className="font-black text-amber-300 mr-2">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                {t.playerName}
              </span>
              <span className="font-bold">{t.score} <span className="text-white/40 text-xs">lv{t.level}</span></span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
