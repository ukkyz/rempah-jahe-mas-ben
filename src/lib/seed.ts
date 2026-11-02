import { db, ensureSchema } from "@/db";
import { products, rewards, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

const PRODUCTS = [
  { name: "Wedang Jahe Mas Ben", description: "Jahe emprit tumbuk segar, gula aren asli, disajikan panas mengepul.", price: 8000, category: "hangat", emoji: "🫚", benefits: "Masuk angin, pilek, pegal" },
  { name: "Jahe Sereh Madu", description: "Jahe, sereh wangi, dan madu hutan. Harum, hangat, menenangkan.", price: 10000, category: "hangat", emoji: "🍯", benefits: "Batuk, tenggorokan, relaksasi" },
  { name: "Wedang Uwuh Imogiri", description: "Secang, cengkeh, kayu manis, pala, jahe bakar. Warna merah merona khas Jogja.", price: 12000, category: "hangat", emoji: "🍂", benefits: "Daya tahan tubuh, pegal-pegal" },
  { name: "Kunyit Asam Sirih", description: "Kunyit segar, asam jawa, daun sirih. Segar dan menyehatkan.", price: 9000, category: "dingin", emoji: "🌼", benefits: "Nyeri haid, asam lambung, kulit" },
  { name: "Temulawak Madu", description: "Temulawak pilihan dengan madu, pahit manis yang menyehatkan hati.", price: 10000, category: "hangat", emoji: "🌱", benefits: "Nafsu makan, hati, mual" },
  { name: "Bir Pletok Rempah", description: "Minuman Betawi tanpa alkohol, jahe, secang, kayu manis dan kapulaga.", price: 12000, category: "dingin", emoji: "🍹", benefits: "Lancar darah, hangat badan" },
  { name: "Wedang Ronde Mas Ben", description: "Kuah jahe panas dengan bola ketan isi kacang, kolang-kaling, dan roti.", price: 13000, category: "hangat", emoji: "🍡", benefits: "Masuk angin, kenyang hangat" },
  { name: "Jahe Susu Jogja", description: "Jahe tumbuk dipadu susu segar dan gula aren. Creamy dan hangat.", price: 12000, category: "hangat", emoji: "🥛", benefits: "Energi, tidur nyenyak" },
  { name: "Beras Kencur Segar", description: "Beras sangrai, kencur, jahe, dan gula merah. Resep leluhur Jawa.", price: 9000, category: "dingin", emoji: "🌾", benefits: "Pegal-pegal, stamina, nafsu makan" },
  { name: "Sekoteng Hangat", description: "Kuah jahe dengan kacang hijau, kacang tanah, pacar cina, dan roti.", price: 13000, category: "hangat", emoji: "🥣", benefits: "Masuk angin, hangat, energi" },
  { name: "Jahe Merah Spesial", description: "Jahe merah pedas kuat untuk pemulihan setelah olahraga berat.", price: 11000, category: "atlet", emoji: "🔴", benefits: "Pemulihan otot, pegal, stamina" },
  { name: "Recovery Spice Shot", description: "Shot kunyit-jahe-lada hitam pekat untuk pemain badminton, futsal & gym.", price: 15000, category: "atlet", emoji: "⚡", benefits: "Anti radang, pemulihan otot" },
];

const REWARDS = [
  { name: "Gratis Wedang Jahe", description: "Tukar poin dengan segelas Wedang Jahe Mas Ben.", pointsCost: 80, emoji: "🫚", stock: 500 },
  { name: "Diskon Rp5.000", description: "Potongan Rp5.000 untuk pembelian berikutnya.", pointsCost: 50, emoji: "🏷️", stock: 500 },
  { name: "Gratis Wedang Uwuh", description: "Segelas Wedang Uwuh Imogiri gratis.", pointsCost: 120, emoji: "🍂", stock: 300 },
  { name: "Topping Ronde Ekstra", description: "Tambahan bola ronde dan kacang gratis.", pointsCost: 30, emoji: "🍡", stock: 500 },
  { name: "Bundel Rempah Kering", description: "Paket rempah kering 100gr untuk diseduh di rumah.", pointsCost: 250, emoji: "🎁", stock: 50 },
  { name: "Tumbler Mas Ben", description: "Tumbler eksklusif edisi REMPAH JAHE MAS BEN.", pointsCost: 600, emoji: "🥤", stock: 20 },
];

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  await ensureSchema();
  try {
    const existing = await db.select({ id: products.id }).from(products).limit(1);
    if (existing.length === 0) {
      await db.insert(products).values(PRODUCTS);
    }
    const existingRewards = await db.select({ id: rewards.id }).from(rewards).limit(1);
    if (existingRewards.length === 0) {
      await db.insert(rewards).values(REWARDS);
    }
    const admin = await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@masben.id")).limit(1);
    if (admin.length === 0) {
      await db.insert(users).values({
        name: "Mas Ben",
        email: "admin@masben.id",
        phone: "0812-0000-0000",
        passwordHash: hashPassword("masben123"),
        role: "admin",
      });
    }
    seeded = true;
  } catch (err) {
    console.error("Seed error", err);
  }
}
