"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal");
      return;
    }
    router.push(data.user?.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  function fillDemo(role: "admin" | "customer") {
    if (role === "admin") setForm({ ...form, email: "admin@masben.id", password: "masben123" });
    else setForm({ ...form, email: "budi@contoh.id", password: "budi123" });
  }

  return (
    <div className="mx-auto max-w-md px-4">
      <div className="glass-strong p-8 pop">
        <div className="text-center mb-6">
          <div className="text-5xl float inline-block">🫚</div>
          <h1 className="text-2xl font-black mt-2">
            {mode === "login" ? "Selamat Datang Kembali" : "Daftar & Dapat 25 Poin"}
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {mode === "login" ? "Masuk untuk memesan dan menukar poin." : "Gabung keluarga REMPAH JAHE MAS BEN."}
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <>
              <input className="input" placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input" placeholder="No. WhatsApp (opsional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </>
          )}
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Password (min. 6 karakter)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-xl px-3 py-2 shake">{error}</div>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar Sekarang"}
          </button>
        </form>
        {mode === "login" && (
          <div className="mt-4 text-xs text-white/50 text-center space-y-2">
            <p>Akun demo:</p>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={() => fillDemo("admin")} className="chip">🧮 Admin (Mas Ben)</button>
            </div>
            <p className="text-white/40">admin@masben.id / masben123</p>
          </div>
        )}
        <p className="text-center text-sm text-white/60 mt-6">
          {mode === "login" ? (
            <>Belum punya akun? <Link href="/register" className="text-amber-300 font-semibold">Daftar</Link></>
          ) : (
            <>Sudah punya akun? <Link href="/login" className="text-amber-300 font-semibold">Masuk</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
