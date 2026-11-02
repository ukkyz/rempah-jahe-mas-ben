"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { rupiah, tanggal, STATUS_LABEL } from "@/lib/format";

type Stats = {
  income: number; expense: number; profit: number;
  daily: { day: string; income: number; expense: number }[];
  byCategory: { type: string; category: string; total: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  orders: { total: number; pending: number; diproses: number; siap: number; selesai: number };
  customers: { total: number; pointsOutstanding: number };
  topCustomers: { name: string; points: number; totalSpent: number }[];
};
type Tx = { id: number; type: string; category: string; amount: number; description: string; orderId: number | null; createdAt: string };
type Order = { id: number; customerName: string; status: string; total: number; pickupType: string; note: string | null; createdAt: string; items: { id: number; productName: string; qty: number }[] };

const EXPENSE_CATS = ["Bahan Rempah", "Gula Aren & Madu", "Gas & Listrik", "Gelas & Kemasan", "Sewa Tempat", "Gaji Karyawan", "Transport", "Lainnya"];
const INCOME_CATS = ["Penjualan Warung", "Penjualan Online", "Catering/Event", "Lainnya"];
const FLOW = ["pending", "diproses", "siap", "selesai"];

export default function AdminPage() {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"ringkasan" | "pesanan" | "keuangan">("ringkasan");
  const [form, setForm] = useState({ type: "expense", category: EXPENSE_CATS[0], amount: "", description: "", date: "" });
  const [err, setErr] = useState("");

  const load = () => {
    fetch("/api/admin/stats").then(async (r) => {
      if (r.status === 401 || r.status === 403) { setOk(false); router.replace("/login"); return; }
      setOk(true);
      setStats(await r.json());
    });
    fetch("/api/finance").then((r) => r.json()).then((d) => setTxs(d.transactions ?? []));
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
  };
  useEffect(load, [router]);

  async function addTx(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error); return; }
    setForm({ ...form, amount: "", description: "" });
    load();
  }

  async function delTx(id: number) {
    if (!confirm("Hapus transaksi ini?")) return;
    await fetch(`/api/finance/${id}`, { method: "DELETE" });
    load();
  }

  async function setStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  if (ok === null) return <div className="text-center text-white/50 py-20">Memuat panel admin...</div>;
  if (!ok || !stats) return null;

  const maxDaily = Math.max(1, ...stats.daily.map((d) => Math.max(d.income, d.expense)));
  const margin = stats.income > 0 ? Math.round((stats.profit / stats.income) * 100) : 0;
  const activeOrders = orders.filter((o) => !["selesai", "batal"].includes(o.status));
  const doneOrders = orders.filter((o) => ["selesai", "batal"].includes(o.status));

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Panel Mas Ben</p>
          <h1 className="text-3xl md:text-4xl font-black">Pengelolaan <span className="neon-text">Warung</span></h1>
        </div>
        <div className="flex gap-2">
          {(["ringkasan", "pesanan", "keuangan"] as const).map((t) => (
            <button key={t} className={`chip ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "ringkasan" ? "📊 Ringkasan" : t === "pesanan" ? `🧾 Pesanan${activeOrders.length ? ` (${activeOrders.length})` : ""}` : "💰 Keuangan"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass p-5"><div className="text-xs text-white/50 uppercase">Pemasukan</div><div className="text-2xl font-black text-emerald-300">{rupiah(stats.income)}</div></div>
        <div className="glass p-5"><div className="text-xs text-white/50 uppercase">Pengeluaran</div><div className="text-2xl font-black text-red-300">{rupiah(stats.expense)}</div></div>
        <div className="glass p-5 border-amber-300/40"><div className="text-xs text-white/50 uppercase">Laba Bersih</div><div className={`text-2xl font-black ${stats.profit >= 0 ? "neon-text" : "text-red-300"}`}>{rupiah(stats.profit)}</div><div className="text-[10px] text-white/50">Margin {margin}%</div></div>
        <div className="glass p-5"><div className="text-xs text-white/50 uppercase">Pelanggan</div><div className="text-2xl font-black">{stats.customers.total}</div><div className="text-[10px] text-white/50">{stats.customers.pointsOutstanding} poin beredar (≈{rupiah(stats.customers.pointsOutstanding * 100)})</div></div>
      </div>

      {tab === "ringkasan" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="glass p-6">
            <h3 className="font-black">📈 Arus Kas 14 Hari</h3>
            {stats.daily.length === 0 ? <p className="text-sm text-white/50 mt-3">Belum ada transaksi.</p> : (
              <div className="flex items-end gap-2 h-48 mt-4">
                {stats.daily.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-8 hidden group-hover:block glass !rounded-lg px-2 py-1 text-[10px] whitespace-nowrap z-10">+{rupiah(d.income)} / -{rupiah(d.expense)}</div>
                    <div className="w-full flex gap-0.5 items-end h-40">
                      <div className="flex-1 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-300" style={{ height: `${(d.income / maxDaily) * 100}%` }} />
                      <div className="flex-1 rounded-t bg-gradient-to-t from-red-600 to-red-300" style={{ height: `${(d.expense / maxDaily) * 100}%` }} />
                    </div>
                    <div className="text-[9px] text-white/50">{d.day.slice(5)}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-4 text-xs mt-2 text-white/60"><span>🟩 Pemasukan</span><span>🟥 Pengeluaran</span></div>
          </div>

          <div className="glass p-6">
            <h3 className="font-black">🧾 Status Pesanan</h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[["pending", stats.orders.pending], ["diproses", stats.orders.diproses], ["siap", stats.orders.siap], ["selesai", stats.orders.selesai]].map(([s, n]) => (
                <div key={s} className={`glass !rounded-xl p-3 border ${STATUS_LABEL[s as string].color}`}>
                  <div className="text-xs">{STATUS_LABEL[s as string].label}</div>
                  <div className="text-2xl font-black">{n}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-white/50 mt-3">Total {stats.orders.total} pesanan online tercatat.</div>
          </div>

          <div className="glass p-6">
            <h3 className="font-black">🏆 Menu Terlaris</h3>
            <div className="space-y-2 mt-4">
              {stats.topProducts.length === 0 && <p className="text-sm text-white/50">Belum ada penjualan.</p>}
              {stats.topProducts.map((p, i) => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm"><span>{i + 1}. {p.name}</span><span className="text-white/60">{p.qty} gelas · {rupiah(p.revenue)}</span></div>
                  <div className="progress !h-2 mt-1"><div style={{ width: `${(p.qty / stats.topProducts[0].qty) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6">
            <h3 className="font-black">📂 Per Kategori</h3>
            <div className="space-y-2 mt-4 text-sm">
              {stats.byCategory.length === 0 && <p className="text-white/50">Belum ada data.</p>}
              {stats.byCategory.map((c) => (
                <div key={c.type + c.category} className="flex justify-between glass !rounded-xl px-3 py-2">
                  <span>{c.type === "income" ? "🟢" : "🔴"} {c.category}</span>
                  <span className={`font-bold ${c.type === "income" ? "text-emerald-300" : "text-red-300"}`}>{rupiah(c.total)}</span>
                </div>
              ))}
            </div>
            <h3 className="font-black mt-6">💎 Pelanggan Terbaik</h3>
            <div className="space-y-1 mt-2 text-sm">
              {stats.topCustomers.map((c, i) => (
                <div key={c.name + i} className="flex justify-between"><span>{i + 1}. {c.name}</span><span className="text-white/60">{rupiah(c.totalSpent)} · {c.points}⭐</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "pesanan" && (
        <div className="space-y-6">
          <section>
            <h3 className="font-black text-lg mb-3">🔥 Pesanan Aktif ({activeOrders.length})</h3>
            {activeOrders.length === 0 && <div className="glass p-8 text-center text-white/50">Tidak ada pesanan aktif. Santai dulu, Mas Ben ☕</div>}
            <div className="grid md:grid-cols-2 gap-3">
              {activeOrders.map((o) => (
                <div key={o.id} className={`glass p-5 border ${STATUS_LABEL[o.status].color}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black">#{o.id} · {o.customerName}</div>
                      <div className="text-xs text-white/50">{tanggal(o.createdAt)} · {o.pickupType === "antar" ? "🛵 Antar" : "🏪 Ambil"}</div>
                    </div>
                    <div className="font-black text-amber-300">{rupiah(o.total)}</div>
                  </div>
                  <ul className="mt-2 text-sm space-y-0.5">
                    {o.items.map((i) => <li key={i.id}>• {i.productName} <b>×{i.qty}</b></li>)}
                  </ul>
                  {o.note && <div className="text-xs text-cyan-200 mt-2">📝 {o.note}</div>}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {FLOW.map((s) => (
                      <button key={s} onClick={() => setStatus(o.id, s)} className={`chip text-xs ${o.status === s ? "active" : ""}`}>{STATUS_LABEL[s].label}</button>
                    ))}
                    <button onClick={() => confirm("Batalkan pesanan? Poin pelanggan akan dikembalikan.") && setStatus(o.id, "batal")} className="chip text-xs text-red-300">Batal</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="font-black text-lg mb-3">📁 Riwayat ({doneOrders.length})</h3>
            <div className="glass p-2 max-h-96 overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-white/50 text-xs text-left"><tr><th className="p-2">#</th><th className="p-2">Pelanggan</th><th className="p-2">Item</th><th className="p-2">Total</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {doneOrders.map((o) => (
                    <tr key={o.id} className="border-t border-white/5">
                      <td className="p-2">{o.id}</td><td className="p-2">{o.customerName}</td>
                      <td className="p-2 text-white/60">{o.items.map((i) => `${i.productName}×${i.qty}`).join(", ")}</td>
                      <td className="p-2">{rupiah(o.total)}</td>
                      <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABEL[o.status].color}`}>{STATUS_LABEL[o.status].label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "keuangan" && (
        <div className="grid lg:grid-cols-[360px_1fr] gap-5">
          <form onSubmit={addTx} className="glass-strong p-6 space-y-3 h-fit">
            <h3 className="font-black">➕ Catat Transaksi</h3>
            <div className="flex gap-2">
              {(["income", "expense"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setForm({ ...form, type: t, category: t === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0] })} className={`chip flex-1 justify-center ${form.type === t ? "active" : ""}`}>
                  {t === "income" ? "🟢 Pemasukan" : "🔴 Pengeluaran"}
                </button>
              ))}
            </div>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input" type="number" min={1} placeholder="Nominal (Rp)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input className="input" placeholder="Keterangan" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            {err && <div className="text-sm text-red-300">{err}</div>}
            <button className="btn-primary w-full">Simpan</button>
            <p className="text-[10px] text-white/40">Pesanan online yang ditandai <b>Selesai</b> otomatis tercatat sebagai pemasukan.</p>
          </form>

          <div className="glass p-4">
            <h3 className="font-black px-2 mb-2">📒 Buku Kas ({txs.length})</h3>
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-white/50 text-xs text-left sticky top-0 bg-[#0d1322]"><tr><th className="p-2">Tanggal</th><th className="p-2">Kategori</th><th className="p-2">Keterangan</th><th className="p-2 text-right">Nominal</th><th></th></tr></thead>
                <tbody>
                  {txs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-white/50">Belum ada transaksi. Catat pemasukan atau pengeluaran pertama.</td></tr>}
                  {txs.map((t) => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="p-2 text-white/60 whitespace-nowrap">{tanggal(t.createdAt)}</td>
                      <td className="p-2">{t.type === "income" ? "🟢" : "🔴"} {t.category}</td>
                      <td className="p-2 text-white/70">{t.description}</td>
                      <td className={`p-2 text-right font-bold whitespace-nowrap ${t.type === "income" ? "text-emerald-300" : "text-red-300"}`}>{t.type === "income" ? "+" : "-"}{rupiah(t.amount)}</td>
                      <td className="p-2"><button onClick={() => delTx(t.id)} className="text-white/30 hover:text-red-300">🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
