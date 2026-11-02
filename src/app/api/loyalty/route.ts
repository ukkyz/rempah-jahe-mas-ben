import { db } from "@/db";
import { gameScores, orders, pointHistory, redemptions, users } from "@/db/schema";
import { errorResponse, getCurrentUser, levelFor } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const user = await getCurrentUser();
    const leaderboard = await db
      .select({ name: users.name, points: users.points, totalSpent: users.totalSpent })
      .from(users)
      .where(eq(users.role, "customer"))
      .orderBy(desc(sql`${users.points} + ${users.totalSpent} / 1000`))
      .limit(10);

    if (!user) return Response.json({ user: null, leaderboard, history: [], redemptions: [], badges: [] });

    const history = await db
      .select()
      .from(pointHistory)
      .where(eq(pointHistory.userId, user.id))
      .orderBy(desc(pointHistory.createdAt))
      .limit(30);
    const myRedemptions = await db
      .select()
      .from(redemptions)
      .where(eq(redemptions.userId, user.id))
      .orderBy(desc(redemptions.createdAt));
    const [oc] = await db
      .select({
        count: sql<number>`count(*) filter (where ${orders.status} <> 'batal')`,
        distinct: sql<number>`count(distinct date(${orders.createdAt}, 'unixepoch'))`,
      })
      .from(orders)
      .where(eq(orders.userId, user.id));
    const [gs] = await db
      .select({ best: sql<number>`coalesce(max(${gameScores.score}), 0)`, plays: sql<number>`count(*)` })
      .from(gameScores)
      .where(eq(gameScores.userId, user.id));

    const orderCount = Number(oc?.count ?? 0);
    const days = Number(oc?.distinct ?? 0);
    const best = Number(gs?.best ?? 0);
    const plays = Number(gs?.plays ?? 0);

    const badges = [
      { id: "first", emoji: "🥇", name: "Seduhan Pertama", desc: "Pesanan pertama", earned: orderCount >= 1 },
      { id: "five", emoji: "🔥", name: "Langganan Hangat", desc: "5 pesanan", earned: orderCount >= 5 },
      { id: "ten", emoji: "🏆", name: "Juragan Wedang", desc: "10 pesanan", earned: orderCount >= 10 },
      { id: "days", emoji: "📅", name: "Rutin Sehat", desc: "Datang di 3 hari berbeda", earned: days >= 3 },
      { id: "spender", emoji: "💎", name: "Sultan Rempah", desc: "Belanja total Rp200.000", earned: user.totalSpent >= 200000 },
      { id: "redeem", emoji: "🎁", name: "Penukar Cerdas", desc: "Tukar hadiah pertama", earned: myRedemptions.length >= 1 },
      { id: "gamer", emoji: "🎮", name: "Peracik Cilik", desc: "Main game meracik", earned: plays >= 1 },
      { id: "master", emoji: "🧪", name: "Master Peracik", desc: "Skor game ≥ 500", earned: best >= 500 },
    ];

    return Response.json({
      user: { ...user, level: levelFor(user.points, user.totalSpent) },
      leaderboard,
      history,
      redemptions: myRedemptions,
      badges,
      stats: { orderCount, days, best, plays },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
