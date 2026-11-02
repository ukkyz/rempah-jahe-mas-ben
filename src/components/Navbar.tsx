"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Me = { id: number; name: string; role: string; points: number } | null;

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/menu", label: "Pesan" },
  { href: "/rempah", label: "25 Rempah" },
  { href: "/game", label: "Game Anak" },
  { href: "/loyalty", label: "Poin & Hadiah" },
];

export default function Navbar() {
  const [me, setMe] = useState<Me>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 pt-3">
      <nav className="glass-strong mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:rotate-12 transition-transform">🫚</span>
          <div className="leading-tight">
            <div className="font-black tracking-wide text-sm md:text-base neon-text">REMPAH JAHE MAS BEN</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">Jogjakarta</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                pathname === l.href
                  ? "bg-white/15 text-amber-300 shadow-[0_0_16px_rgba(245,185,69,0.3)]"
                  : "text-white/75 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {me ? (
            <>
              {me.role === "admin" && (
                <Link href="/admin" className="btn-ghost !py-1.5 !px-3 text-sm">
                  🧮 Admin
                </Link>
              )}
              <Link href="/dashboard" className="btn-primary !py-1.5 !px-4 text-sm">
                ⭐ {me.points} · {me.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="text-white/60 hover:text-white text-sm px-2">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !py-1.5 !px-4 text-sm">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary !py-1.5 !px-4 text-sm">
                Daftar
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-2xl px-2"
          aria-label="menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {open && (
        <div className="glass-strong mx-auto max-w-6xl mt-2 p-4 flex flex-col gap-2 md:hidden pop">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-white/10">
              {l.label}
            </Link>
          ))}
          <div className="h-px bg-white/10 my-1" />
          {me ? (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl bg-white/10">
                ⭐ {me.points} poin · {me.name}
              </Link>
              {me.role === "admin" && (
                <Link href="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-white/10">
                  🧮 Admin Keuangan
                </Link>
              )}
              <button onClick={logout} className="text-left px-3 py-2 text-white/60">
                Keluar
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1">
                Masuk
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
