"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { rupiah } from "@/lib/format";

type Product = { id: number; name: string; description: string; price: number; category: string; emoji: string; benefits: string };
type Me = { id: number; name: string; points: number } | null;

const CATS = [
  { key: "semua", label: "Semua", e: "✨" },
  { key: "hangat", label: "Hangat", e: "🔥" },
  { key: "dingin", label: "Segar", e: "🧊" },
  { key: "atlet", label: "Atlet", e: "⚡" },
];

export default function MenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [me, setMe] = useState<Me>(null);
  const [cat, setCat] = useState("semua");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [usePoints, setUsePoints] = useState(0);
  const [pickupType, setPickupType] = useState<"ambil" | "antar">("ambil");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: number; pointsEarned: number } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user ?? null));
  }, []);

  const filtered = products.filter((p) => cat === "semua" || p.category === cat);
  const lines = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id))!, qty })).filter((l) => l.product && l.qty > 0),
    [cart, products]
  );
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const maxPoints = Math.min(me?.points ?? 0, Math.floor((subtotal * 0.5) / 100));
  const pointsApplied = Math.min(usePoints, maxPoints);
  const discount = pointsApplied * 100;
  const total = subtotal - discount;
  const earn = Math.floor(total / 1000) + (total >= 50000 ? 10 : 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  function add(id: number, d: number) {
    setCart((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] ?? 0) + d) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  async function checkout() {
    if (!me) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })), usePoints: pointsApplied, pickupType, note }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal memesan");
      return;
    }
    setSuccess({ id: data.order.id, pointsEarned: data.pointsEarned });
    setCart({});
    setUsePoints(0);
    setNote("");
    setMe((m) => (m ? { ...m, points: m.points - data.pointsUsed + data.pointsEarned } : m));
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4">
        <div className="glass-strong p-10 text-center pop">
          <div className="text-7xl float inline-block">🎉</div>
          <h1 className="text-3xl font-black mt-4">Pesanan #{success.id} Diterima!</h1>
          <p className="text-white/70 mt-2">Mas Ben sedang menyiapkan racikan hangatmu.</p>
          <div className="glass p-4 mt-6 inline-block">
            <div className="text-sm text-white/60">Poin didapat</div>
            <div className="text-4xl font-black neon-text">+{success.pointsEarned} ⭐</div>
          </div>
          <div className="flex gap-3 justify-center mt-8">
            <Link href="/dashboard" className="btn-primary">Lihat Pesanan</Link>
            <button onClick={() => setSuccess(null)} className="btn-ghost">Pesan Lagi</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Pesan Online</p>
        <h1 className="text-3xl md:text-5xl font-black mt-2">
          Menu <span className="neon-text">Wedang Mas Ben</span>
        </h1>
        <p className="text-white/60 mt-2">Setiap Rp1.000 = 1 poin · Tukar poin untuk potongan hingga 50%</p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap mb-8">
        {CATS.map((c) => (
          <button key={c.key} className={`chip ${cat === c.key ? "active" : ""}`} onClick={() => setCat(c.key)}>
            {c.e} {c.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((p, i) => {
            const qty = cart[p.id] ?? 0;
            return (
              <div key={p.id} className={`glass glass-hover p-5 flex flex-col fade-up delay-${(i % 4) + 1}`}>
                <div className="flex items-start justify-between">
                  <div className="text-5xl float-slow">{p.emoji}</div>
                  <div className="text-right">
                    <div className="font-black text-amber-300 text-lg">{rupiah(p.price)}</div>
                    <div className="text-[10px] text-white/50">+{Math.floor(p.price / 1000)} poin</div>
                  </div>
                </div>
                <h3 className="font-bold text-lg mt-3">{p.name}</h3>
                <p className="text-sm text-white/60 mt-1 flex-1">{p.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.benefits.split(",").map((b) => (
                    <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-200 border border-emerald-300/20">
                      ✓ {b.trim()}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  {qty === 0 ? (
                    <button onClick={() => add(p.id, 1)} className="btn-primary w-full !py-2">+ Tambah</button>
                  ) : (
                    <div className="flex items-center justify-between glass !rounded-full px-2 py-1">
                      <button onClick={() => add(p.id, -1)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 font-bold">−</button>
                      <span className="font-black text-lg pop" key={qty}>{qty}</span>
                      <button onClick={() => add(p.id, 1)} className="w-9 h-9 rounded-full bg-amber-400 text-black hover:bg-amber-300 font-bold">+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {products.length === 0 && <div className="text-white/50 col-span-2 text-center py-10">Memuat menu...</div>}
        </div>

        {/* Cart */}
        <aside className={`lg:sticky lg:top-28 h-fit ${cartOpen ? "fixed inset-x-3 bottom-3 z-40 lg:static" : "hidden lg:block"}`}>
          <div className="glass-strong p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-xl">🛒 Keranjang</h2>
              <button className="lg:hidden text-white/60" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {lines.length === 0 ? (
              <p className="text-white/50 text-sm mt-4">Belum ada wedang dipilih. Yuk pilih dulu!</p>
            ) : (
              <div className="mt-4 space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                {lines.map((l) => (
                  <div key={l.product.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      {l.product.emoji} {l.product.name} <span className="text-white/50">×{l.qty}</span>
                    </span>
                    <span className="font-semibold">{rupiah(l.product.price * l.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-px bg-white/10 my-4" />

            <div className="flex gap-2">
              {(["ambil", "antar"] as const).map((t) => (
                <button key={t} onClick={() => setPickupType(t)} className={`chip flex-1 justify-center ${pickupType === t ? "active" : ""}`}>
                  {t === "ambil" ? "🏪 Ambil di Warung" : "🛵 Diantar"}
                </button>
              ))}
            </div>
            <textarea className="input mt-3 text-sm" rows={2} placeholder="Catatan: kurangi gula, ekstra jahe..." value={note} onChange={(e) => setNote(e.target.value)} />

            {me && (
              <div className="mt-3 glass p-3">
                <div className="flex justify-between text-sm">
                  <span>⭐ Pakai poin (punya {me.points})</span>
                  <span className="text-amber-300 font-bold">{pointsApplied} = -{rupiah(discount)}</span>
                </div>
                <input type="range" min={0} max={maxPoints} value={pointsApplied} onChange={(e) => setUsePoints(Number(e.target.value))} className="w-full mt-2 accent-amber-400" disabled={maxPoints === 0} />
                <div className="text-[10px] text-white/40">1 poin = Rp100 · maks 50% dari subtotal</div>
              </div>
            )}

            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-white/60"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-300"><span>Potongan poin</span><span>-{rupiah(discount)}</span></div>}
              <div className="flex justify-between font-black text-xl pt-1"><span>Total</span><span className="neon-text">{rupiah(total)}</span></div>
              {lines.length > 0 && <div className="text-xs text-cyan-200">Kamu akan dapat +{earn} poin {total >= 50000 && "(termasuk bonus 10 poin!)"}</div>}
            </div>

            {error && <div className="text-sm text-red-300 mt-3 shake">{error}</div>}

            <button onClick={checkout} disabled={lines.length === 0 || loading} className="btn-primary w-full mt-4">
              {loading ? "Memproses..." : me ? "Pesan Sekarang" : "Masuk untuk Memesan"}
            </button>
            {!me && (
              <p className="text-xs text-center text-white/50 mt-2">
                Belum punya akun? <Link href="/register" className="text-amber-300">Daftar & dapat 25 poin</Link>
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* mobile cart button */}
      {count > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} className="lg:hidden fixed bottom-4 inset-x-4 btn-primary z-40 shadow-2xl">
          🛒 {count} item · {rupiah(total)} · Checkout
        </button>
      )}
    </div>
  );
}
