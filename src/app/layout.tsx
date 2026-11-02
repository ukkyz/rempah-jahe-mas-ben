import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "REMPAH JAHE MAS BEN Jogjakarta — Minuman Warisan Nusantara",
  description:
    "Warung minuman rempah warisan nusantara di Jogjakarta. Pesan online, kumpulkan poin, dan kenali 25 rempah penyehat tubuh.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">
        <div className="bg-aurora" />
        <div className="bg-grid" />
        <Navbar />
        <main className="pt-24 pb-16 min-h-screen">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10">
          <div className="glass px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/70">
            <div>
              <span className="font-bold text-white">🫚 REMPAH JAHE MAS BEN</span> · Jogjakarta · Buka setiap hari 17.00 – 24.00 WIB
            </div>
            <div className="flex gap-4">
              <span>📸 @jaherempah.masben</span>
              <span>📱 0812-xxxx-xxxx</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
