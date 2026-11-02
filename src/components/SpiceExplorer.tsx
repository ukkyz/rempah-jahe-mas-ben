"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AILMENTS, SPICES, type Spice } from "@/data/spices";

export default function SpiceExplorer() {
  const params = useSearchParams();
  const [filter, setFilter] = useState<string>("semua");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Spice | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);

  useEffect(() => {
    const s = params.get("s");
    if (s) {
      const sp = SPICES.find((x) => x.id === Number(s));
      if (sp) setSelected(sp);
    }
  }, [params]);

  const list = useMemo(
    () =>
      SPICES.filter((s) => (filter === "semua" || s.ailments.includes(filter)) && (query === "" || s.name.toLowerCase().includes(query.toLowerCase()) || s.latin.toLowerCase().includes(query.toLowerCase()))),
    [filter, query]
  );

  const recommendation = useMemo(() => {
    if (symptoms.length === 0) return [];
    return SPICES.map((s) => ({ s, hit: s.ailments.filter((a) => symptoms.includes(a)).length }))
      .filter((x) => x.hit > 0)
      .sort((a, b) => b.hit - a.hit)
      .slice(0, 6);
  }, [symptoms]);

  function toggleSymptom(k: string) {
    setSymptoms((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-10">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Ensiklopedia Interaktif</p>
        <h1 className="text-3xl md:text-5xl font-black mt-2">
          25 Rempah <span className="neon-text">Penyehat Tubuh</span>
        </h1>
        <p className="text-white/60 mt-3 max-w-2xl mx-auto">
          Klik rempah untuk membaca manfaatnya, atau gunakan <b>Cek Keluhanmu</b> untuk menemukan rempah yang paling cocok.
        </p>
      </div>

      {/* Symptom checker */}
      <section className="glass-strong p-6 md:p-8">
        <h2 className="text-xl font-black flex items-center gap-2">🩺 Cek Keluhanmu</h2>
        <p className="text-sm text-white/60 mt-1">Pilih satu atau lebih keluhan yang sedang kamu rasakan:</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {AILMENTS.map((a) => (
            <button key={a.key} className={`chip ${symptoms.includes(a.key) ? "active" : ""}`} onClick={() => toggleSymptom(a.key)}>
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
        {recommendation.length > 0 && (
          <div className="mt-6 pop">
            <div className="text-sm font-semibold text-amber-300 mb-3">✨ Rempah yang direkomendasikan untukmu:</div>
            <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {recommendation.map(({ s, hit }) => (
                <button key={s.id} onClick={() => setSelected(s)} className="glass glass-hover p-4 text-center">
                  <div className="text-4xl">{s.emoji}</div>
                  <div className="font-bold text-sm mt-2">{s.name}</div>
                  <div className="text-[10px] text-emerald-300">{hit}/{symptoms.length} keluhan cocok</div>
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm text-white/70">
              Racikan yang cocok:{" "}
              {[...new Set(recommendation.flatMap((r) => r.s.usedIn))].slice(0, 4).map((d) => (
                <span key={d} className="chip !cursor-default mr-1 mb-1 text-xs">🍵 {d}</span>
              ))}
              <Link href="/menu" className="text-amber-300 font-semibold ml-2">Pesan sekarang →</Link>
            </div>
          </div>
        )}
      </section>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <input className="input md:max-w-xs" placeholder="🔍 Cari rempah..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 w-full">
          <button className={`chip ${filter === "semua" ? "active" : ""}`} onClick={() => setFilter("semua")}>✨ Semua (25)</button>
          {AILMENTS.map((a) => (
            <button key={a.key} className={`chip ${filter === a.key ? "active" : ""}`} onClick={() => setFilter(a.key)}>
              {a.emoji} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {list.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSelected(s)}
            className={`glass glass-hover p-5 text-left relative overflow-hidden fade-up delay-${(i % 5) + 1}`}
            style={{ boxShadow: `inset 0 -40px 60px -40px ${s.color}66` }}
          >
            <div className="absolute top-2 right-3 text-xs font-black text-white/20">#{String(s.id).padStart(2, "0")}</div>
            <div className="text-5xl float-slow inline-block" style={{ animationDelay: `${i * 0.2}s` }}>{s.emoji}</div>
            <div className="font-bold mt-3">{s.name}</div>
            <div className="text-[10px] italic text-white/50">{s.latin}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {s.ailments.slice(0, 3).map((a) => {
                const al = AILMENTS.find((x) => x.key === a);
                return <span key={a} className="text-[10px]" title={al?.label}>{al?.emoji}</span>;
              })}
            </div>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="text-center text-white/50">Tidak ada rempah yang cocok.</p>}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="glass-strong w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 pop scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl pulse-glow" style={{ background: `${selected.color}33`, border: `1px solid ${selected.color}88` }}>
                  {selected.emoji}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black">{selected.name}</h2>
                  <p className="italic text-white/50 text-sm">{selected.latin}</p>
                  <p className="text-xs text-amber-300 mt-1">Rasa: {selected.taste}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white text-xl">✕</button>
            </div>

            <p className="text-white/80 mt-5">{selected.description}</p>

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="glass p-4">
                <h3 className="font-bold text-emerald-300 mb-2">💚 Manfaat Kesehatan</h3>
                <ul className="space-y-1 text-sm">
                  {selected.benefits.map((b) => (
                    <li key={b} className="flex gap-2"><span>✓</span><span>{b}</span></li>
                  ))}
                </ul>
              </div>
              <div className="glass p-4">
                <h3 className="font-bold text-cyan-300 mb-2">🏸 Untuk Atlet & Pekerja Berat</h3>
                <p className="text-sm text-white/80">{selected.forAthletes}</p>
                <h3 className="font-bold text-amber-300 mb-2 mt-4">🎯 Keluhan yang diatasi</h3>
                <div className="flex flex-wrap gap-1">
                  {selected.ailments.map((a) => {
                    const al = AILMENTS.find((x) => x.key === a);
                    return <span key={a} className="chip !cursor-default text-xs">{al?.emoji} {al?.label}</span>;
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="font-bold mb-2">🍵 Dipakai dalam racikan</h3>
              <div className="flex flex-wrap gap-2">
                {selected.usedIn.map((d) => (
                  <Link key={d} href="/menu" className="chip">{d} →</Link>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-between">
              <button className="btn-ghost !py-2" onClick={() => setSelected(SPICES[(selected.id - 2 + SPICES.length) % SPICES.length])}>← Sebelumnya</button>
              <button className="btn-ghost !py-2" onClick={() => setSelected(SPICES[selected.id % SPICES.length])}>Berikutnya →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
