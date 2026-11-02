export const rupiah = (n: number) =>
  "Rp" + Math.round(n).toLocaleString("id-ID");

export const tanggal = (d: string | Date) =>
  new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-yellow-400/20 text-yellow-200 border-yellow-300/30" },
  diproses: { label: "Diracik", color: "bg-cyan-400/20 text-cyan-200 border-cyan-300/30" },
  siap: { label: "Siap Diambil", color: "bg-emerald-400/20 text-emerald-200 border-emerald-300/30" },
  selesai: { label: "Selesai", color: "bg-white/10 text-white/70 border-white/20" },
  batal: { label: "Dibatalkan", color: "bg-red-400/20 text-red-200 border-red-300/30" },
};
