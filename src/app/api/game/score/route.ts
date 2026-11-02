import { db } from "@/db";
import { gameScores, pointHistory, users } from "@/db/schema";
import { errorResponse, getCurrentUser } from "@/lib/auth";
import { and, desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const top = await db
      .select({ playerName: gameScores.playerName, score: gameScores.score, level: gameScores.level, createdAt: gameScores.createdAt })
      .from(gameScores)
      .orderBy(desc(gameScores.score))
      .limit(10);
    return Response.json({ top });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const score = Math.max(0, Math.min(100000, Math.floor(Number(body.score ?? 0))));
    const level = Math.max(1, Math.floor(Number(body.level ?? 1)));
    const playerName = String(body.playerName ?? user?.name ?? "Peracik Cilik").slice(0, 40) || "Peracik Cilik";

    await db.insert(gameScores).values({ userId: user?.id ?? null, playerName, score, level });

    // Loyalty bonus: logged-in players get up to 5 poin per day from the game.
    let bonus = 0;
    if (user && score >= 100) {
      const [today] = await db
        .select({ c: sql<number>`count(*)` })
        .from(pointHistory)
        .where(
          and(
            eq(pointHistory.userId, user.id),
            sql`${pointHistory.reason} like 'Bonus game%'`,
            sql`${pointHistory.createdAt} >= unixepoch('now', 'start of day')`
          )
        );
      if (Number(today?.c ?? 0) === 0) {
        bonus = 5;
        await db.update(users).set({ points: sql`${users.points} + ${bonus}` }).where(eq(users.id, user.id));
        await db.insert(pointHistory).values({ userId: user.id, delta: bonus, reason: "Bonus game meracik 🎮" });
      }
    }
    return Response.json({ ok: true, bonus });
  } catch (err) {
    return errorResponse(err);
  }
}
