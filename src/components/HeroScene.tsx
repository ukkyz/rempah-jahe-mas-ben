"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ORBIT = [
  { e: "🫚", r: 150, d: 18, delay: 0 },
  { e: "🌼", r: 150, d: 18, delay: -6 },
  { e: "🍯", r: 150, d: 18, delay: -12 },
  { e: "🌿", r: 210, d: 26, delay: 0 },
  { e: "🪵", r: 210, d: 26, delay: -6.5 },
  { e: "⭐", r: 210, d: 26, delay: -13 },
  { e: "🌰", r: 210, d: 26, delay: -19.5 },
];

const TAGLINES = [
  "Hangatnya warisan leluhur",
  "Racikan rempah asli Jogja",
  "Pulih setelah badminton & futsal",
  "Sehat tanpa bahan kimia",
];

export default function HeroScene() {
  const [tag, setTag] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTag((t) => (t + 1) % TAGLINES.length), 2600);
    return () => clearInterval(id);
  }, []);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  }

  return (
    <section className="grid md:grid-cols-2 gap-10 items-center min-h-[80vh]">
      <div className="space-y-6">
        <div className="chip !cursor-default fade-up text-amber-200 border-amber-300/30 bg-amber-400/10">
          🏮 Warung Minuman Rempah · Djogjakarta
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] fade-up delay-1">
          <span className="block text-white/90">REMPAH JAHE</span>
          <span className="block neon-text">MAS BEN</span>
        </h1>
        <div className="h-8 overflow-hidden fade-up delay-2">
          <p key={tag} className="text-lg md:text-xl text-cyan-200 pop">
            ✦ {TAGLINES[tag]}
          </p>
        </div>
        <p className="text-white/65 max-w-lg fade-up delay-3">
          Minuman warisan nusantara dari 25 rempah pilihan. Ampuh untuk asam lambung, batuk, pilek, masuk angin, mual,
          nyeri haid, dan pegal-pegal. Cocok untuk kamu yang baru selesai berolahraga.
        </p>
        <div className="flex flex-wrap gap-3 fade-up delay-4">
          <Link href="/menu" className="btn-primary">
            🫚 Pesan Wedang
          </Link>
          <Link href="/rempah" className="btn-ghost">
            🌿 Kenali 25 Rempah
          </Link>
        </div>
        <div className="flex gap-6 pt-2 fade-up delay-5">
          {[
            ["25+", "Rempah Asli"],
            ["12", "Racikan Wedang"],
            ["1K+", "Gelas / Bulan"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl md:text-3xl font-black neon-cyan">{n}</div>
              <div className="text-xs text-white/50 uppercase tracking-wider">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative h-[420px] md:h-[520px] flex items-center justify-center"
        style={{ perspective: 1000 }}
      >
        {/* rings */}
        <div className="absolute w-[300px] h-[300px] rounded-full border border-white/10 spin-slow" />
        <div className="absolute w-[420px] h-[420px] rounded-full border border-dashed border-amber-300/20 spin-reverse" />
        <div className="absolute w-[520px] h-[520px] rounded-full bg-amber-400/10 blur-3xl" />

        {/* orbiting spices */}
        {ORBIT.map((o, i) => (
          <div
            key={i}
            className="absolute text-3xl orbit drop-shadow-[0_0_12px_rgba(245,185,69,0.6)]"
            style={{ "--r": `${o.r}px`, "--d": `${o.d}s`, animationDelay: `${o.delay}s` } as React.CSSProperties}
          >
            {o.e}
          </div>
        ))}

        {/* the cup */}
        <div
          className="relative glass-strong w-56 h-72 md:w-64 md:h-80 flex flex-col items-center justify-end pb-8 pulse-glow transition-transform duration-300"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-full h-20 pointer-events-none">
            <span className="steam" style={{ left: "35%", animationDelay: "0s" }} />
            <span className="steam" style={{ left: "50%", animationDelay: "1s" }} />
            <span className="steam" style={{ left: "65%", animationDelay: "2s" }} />
          </div>
          {/* liquid */}
          <div className="absolute inset-x-4 bottom-4 top-24 rounded-[1.2rem] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-300/70 via-orange-500/70 to-amber-900/80" />
            <div className="absolute inset-x-0 top-0 h-6 bg-white/20 blur-md" />
            {[0, 1, 2, 3, 4].map((b) => (
              <span
                key={b}
                className="absolute bottom-0 w-3 h-3 rounded-full bg-white/40 bubble"
                style={{ left: `${15 + b * 17}%`, animationDelay: `${b * 0.5}s` }}
              />
            ))}
          </div>
          <div className="relative text-6xl float">🫚</div>
          <div className="relative mt-2 text-xs uppercase tracking-[0.35em] text-amber-100/90 font-bold">
            Wedang Jahe
          </div>
        </div>

        {/* floating labels */}
        <div className="absolute left-0 top-10 glass px-3 py-2 text-xs font-semibold float-slow">🌬️ Usir masuk angin</div>
        <div className="absolute right-0 top-24 glass px-3 py-2 text-xs font-semibold float">💪 Redakan pegal</div>
        <div className="absolute left-4 bottom-10 glass px-3 py-2 text-xs font-semibold float-fast">🔥 Asam lambung</div>
        <div className="absolute right-6 bottom-16 glass px-3 py-2 text-xs font-semibold float-slow">🩸 Nyeri haid</div>
      </div>
    </section>
  );
}
