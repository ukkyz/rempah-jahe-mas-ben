import Link from "next/link";
import HeroScene from "@/components/HeroScene";
import { SPICES, AILMENTS } from "@/data/spices";

const DRINKS = [
  { emoji: "🫚", name: "Wedang Jahe", tag: "Signature", desc: "Jahe emprit tumbuk + gula aren" },
  { emoji: "🍂", name: "Wedang Uwuh", tag: "Imogiri", desc: "Secang, cengkeh, kayu manis, pala" },
  { emoji: "🌼", name: "Kunyit Asam", tag: "Segar", desc: "Kunyit, asam jawa, daun sirih" },
  { emoji: "🍡", name: "Wedang Ronde", tag: "Favorit", desc: "Kuah jahe + bola ketan kacang" },
  { emoji: "🌾", name: "Beras Kencur", tag: "Leluhur", desc: "Beras sangrai, kencur, gula merah" },
  { emoji: "⚡", name: "Recovery Shot", tag: "Atlet", desc: "Kunyit-jahe-lada hitam pekat" },
];

const STEPS = [
  { n: "01", t: "Daftar Akun", d: "Dapat 25 poin bonus langsung saat mendaftar.", e: "📝" },
  { n: "02", t: "Pesan Online", d: "Pilih wedang favorit, ambil di warung atau diantar.", e: "🛵" },
  { n: "03", t: "Kumpulkan Poin", d: "Setiap Rp1.000 = 1 poin. Naik level jadi Sultan Rempah!", e: "⭐" },
  { n: "04", t: "Tukar Hadiah", d: "Gratis wedang, diskon, sampai tumbler eksklusif.", e: "🎁" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 space-y-24">
      <HeroScene />

      {/* Marquee ailments */}
      <section className="glass overflow-hidden py-4">
        <div className="flex whitespace-nowrap marquee gap-10 text-sm font-semibold text-white/80">
          {[...AILMENTS, ...AILMENTS].map((a, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-lg">{a.emoji}</span> Ampuh untuk {a.label}
              <span className="text-amber-400 ml-6">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* Drinks */}
      <section>
        <div className="text-center mb-10 fade-up">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Racikan Warisan Nusantara</p>
          <h2 className="text-3xl md:text-5xl font-black mt-3">
            Wedang yang <span className="neon-text">Menghangatkan Jiwa</span>
          </h2>
          <p className="text-white/60 mt-3 max-w-2xl mx-auto">
            Diracik langsung oleh Mas Ben dengan rempah segar pilihan dari pasar Beringharjo, setiap gelas adalah warisan.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DRINKS.map((d, i) => (
            <div key={d.name} className={`glass glass-hover p-6 relative overflow-hidden fade-up delay-${(i % 5) + 1}`}>
              <div className="absolute -right-6 -top-6 text-[110px] opacity-10 select-none">{d.emoji}</div>
              <span className="chip !cursor-default text-amber-300">{d.tag}</span>
              <div className="text-5xl mt-4 float-fast inline-block">{d.emoji}</div>
              <h3 className="text-xl font-bold mt-3">{d.name}</h3>
              <p className="text-white/60 text-sm mt-1">{d.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/menu" className="btn-primary">
            🛒 Lihat Menu & Pesan Sekarang
          </Link>
        </div>
      </section>

      {/* For athletes */}
      <section className="glass-strong p-8 md:p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -right-10 -top-20 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl" />
        </div>
        <div className="relative grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300">Untuk Pekerja Berat & Atlet</p>
            <h2 className="text-3xl md:text-4xl font-black mt-3">
              Pulih lebih cepat <span className="neon-cyan">setelah berolahraga</span>
            </h2>
            <p className="text-white/70 mt-4">
              Jahe merah, kunyit, dan lada hitam adalah trio anti radang alami. Minum segelas setelah bermain badminton,
              futsal, atau nge-gym untuk mengurangi pegal dan nyeri otot.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                ["🏸", "Badminton"],
                ["⚽", "Futsal"],
                ["🏋️", "Gym"],
                ["🏃", "Lari"],
                ["👷", "Pekerja Berat"],
              ].map(([e, l]) => (
                <span key={l} className="chip !cursor-default text-base">
                  {e} {l}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["💪", "Pegal-pegal", "Gingerol melemaskan otot kaku"],
              ["🩹", "Anti Radang", "Kurkumin + piperin 20x lebih efektif"],
              ["⚡", "Stamina", "Gula aren energi tahan lama"],
              ["🌬️", "Masuk Angin", "Hangat dari dalam, tidur nyenyak"],
            ].map(([e, t, d]) => (
              <div key={t} className="glass p-5 glass-hover">
                <div className="text-3xl">{e}</div>
                <div className="font-bold mt-2">{t}</div>
                <div className="text-xs text-white/60 mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spices preview */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Ensiklopedia Rempah</p>
            <h2 className="text-3xl md:text-4xl font-black mt-2">
              25 Rempah <span className="neon-text">Penyehat Tubuh</span>
            </h2>
          </div>
          <Link href="/rempah" className="btn-ghost">
            Jelajahi Semua Rempah →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {SPICES.map((s) => (
            <Link
              key={s.id}
              href={`/rempah?s=${s.id}`}
              className="glass glass-hover shrink-0 w-32 p-4 text-center"
              style={{ borderColor: `${s.color}55` }}
            >
              <div className="text-4xl">{s.emoji}</div>
              <div className="text-sm font-bold mt-2">{s.name}</div>
              <div className="text-[10px] text-white/50 mt-1">{s.ailments.length} manfaat</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Loyalty steps */}
      <section>
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-300">Program Loyalitas</p>
          <h2 className="text-3xl md:text-4xl font-black mt-2">
            Minum Sehat, <span className="neon-text">Dapat Hadiah</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`glass glass-hover p-6 fade-up delay-${i + 1}`}>
              <div className="flex items-center justify-between">
                <span className="text-4xl">{s.e}</span>
                <span className="text-4xl font-black text-white/10">{s.n}</span>
              </div>
              <h3 className="font-bold text-lg mt-4">{s.t}</h3>
              <p className="text-white/60 text-sm mt-1">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kids game CTA */}
      <section className="glass-strong p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {["🫚", "🌼", "🍯", "🌿", "🪵", "⭐"].map((e, i) => (
            <span
              key={i}
              className="absolute text-4xl opacity-30 float"
              style={{ left: `${8 + i * 16}%`, top: `${15 + (i % 3) * 25}%`, animationDelay: `${i * 0.6}s` }}
            >
              {e}
            </span>
          ))}
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Untuk Si Kecil</p>
          <h2 className="text-3xl md:text-4xl font-black mt-3">
            🎮 Game <span className="neon-cyan">Peracik Rempah Cilik</span>
          </h2>
          <p className="text-white/70 mt-3 max-w-xl mx-auto">
            Ajak anak mengenal rempah nusantara lewat game seru: racik pesanan wedang sesuai resep sebelum waktu habis!
          </p>
          <Link href="/game" className="btn-primary mt-6">
            Main Sekarang
          </Link>
        </div>
      </section>

      {/* Location */}
      <section className="grid md:grid-cols-3 gap-5">
        {[
          ["📍", "Lokasi", "Jogjakarta — warung tenda spanduk kuning, kursi plastik merah khas angkringan."],
          ["🕔", "Jam Buka", "Setiap hari 17.00 – 24.00 WIB. Paling ramai selepas jam olahraga malam."],
          ["📸", "Instagram", "@jaherempah.masben — tag kami saat ngopi wedang bareng teman!"],
        ].map(([e, t, d]) => (
          <div key={t} className="glass p-6 glass-hover">
            <div className="text-3xl">{e}</div>
            <div className="font-bold mt-2">{t}</div>
            <div className="text-sm text-white/60 mt-1">{d}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
