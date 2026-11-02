"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { rupiah, tanggal, STATUS_LABEL } from "@/lib/format";

type Order = {
  id: number;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  pointsEarned: number;
  pointsUsed: number;
  pickupType: string;
  note: string | null;
  createdAt: string;
  items: { id: number; productName: string; qty: number; price: number }[];
};
type Me = { id: number; name: string; email: string; role: string; points: number; totalSpent: number; level: { name: string; emoji: string } };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/login");
      else setMe(d.user);
    });
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
  };
  useEffect(load, [router]);

  async function cancel(id: number) {
    if (!confirm("Batalkan pesanan ini?")) return;
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "batal" }) });
    load();
  }

  if (me === undefined) return <div className="text-center text-white/50 py-20">Memuat...</div>;
  if (!me) return null;

  const active = orders.filter((o) => !["selesai", "batal"].includes(o.status));

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-8">
      <div className="glass-strong p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Halo,</p>
          <h1 className="text-3xl font-black">{me.name} 👋</h1>
          <div className="chip !cursor-default mt-2 text-amber-200">{me.level.emoji} {me.level.name}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="glass p-4"><div className="text-2xl font-black neon-text">{me.points}</div><div className="text-[10px] text-white/50 uppercase">Poin</div></div>
          <div className="glass p-4"><div className="text-2xl font-black">{orders.filter((o) => o.status !== "batal").length}</div><div className="text-[10px] text-white/50 uppercase">Pesanan</div></div>
          <div className="glass p-4"><div className="text-lg font-black">{rupiah(me.totalSpent)}</div><div className="text-[10px] text-white/50 uppercase">Belanja</div></div>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/menu" className="btn-primary">🛒 Pesan Lagi</Link>
          <Link href="/loyalty" className="btn-ghost">🎁 Tukar Poin</Link>
          {me.role === "admin" && <Link href="/admin" className="btn-ghost">🧮 Admin</Link>}
        </div>
      </div>

      {active.length > 0 && (
        <div className="glass p-5 border-cyan-300/30">
          <div className="font-bold text-cyan-200">🔔 {active.length} pesanan sedang berjalan</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {active.map((o) => (
              <span key={o.id} className={`chip !cursor-default border ${STATUS_LABEL[o.status].color}`}>#{o.id} · {STATUS_LABEL[o.status].label}</span>
            ))}
          </div>
        </div>
      )}

      <section>
        <h2 className="text-xl font-black mb-4">📦 Riwayat Pesanan</h2>
        {orders.length === 0 ? (
          <div className="glass p-10 text-center">
            <div className="text-5xl">🍵</div>
            <p className="text-white/60 mt-2">Belum ada pesanan. Yuk pesan wedang pertamamu!</p>
            <Link href="/menu" className="btn-primary mt-4">Lihat Menu</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="glass p-5">
                <div className="flex flex-wrap justify-between gap-3 items-start">
                  <div>
                    <div className="font-black">Pesanan #{o.id} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${STATUS_LABEL[o.status].color}`}>{STATUS_LABEL[o.status].label}</span></div>
                    <div className="text-xs text-white/50">{tanggal(o.createdAt)} · {o.pickupType === "antar" ? "🛵 Diantar" : "🏪 Ambil di warung"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-amber-300">{rupiah(o.total)}</div>
                    <div className="text-[10px] text-emerald-300">+{o.pointsEarned} poin{o.pointsUsed > 0 && ` · -${o.pointsUsed} dipakai`}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {o.items.map((i) => (
                    <span key={i.id} className="glass !rounded-lg px-2 py-1 text-xs">{i.productName} ×{i.qty}</span>
                  ))}
                </div>
                {o.note && <div className="text-xs text-white/50 mt-2">📝 {o.note}</div>}
                {o.status === "pending" && (
                  <button onClick={() => cancel(o.id)} className="text-xs text-red-300 mt-3 hover:underline">Batalkan pesanan</button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
