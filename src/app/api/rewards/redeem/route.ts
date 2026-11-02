import { db } from "@/db";
import { pointHistory, redemptions, rewards, users } from "@/db/schema";
import { errorResponse, requireUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const rewardId = Number(body.rewardId);
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (!reward || !reward.isActive) return Response.json({ error: "Hadiah tidak tersedia" }, { status: 404 });
    if (reward.stock <= 0) return Response.json({ error: "Stok hadiah habis" }, { status: 400 });
    const [fresh] = await db.select().from(users).where(eq(users.id, user.id));
    if (fresh.points < reward.pointsCost) {
      return Response.json({ error: `Poin kurang. Butuh ${reward.pointsCost}, kamu punya ${fresh.points}` }, { status: 400 });
    }
    const code = "MB-" + randomBytes(3).toString("hex").toUpperCase();
    await db.update(users).set({ points: fresh.points - reward.pointsCost }).where(eq(users.id, user.id));
    await db.update(rewards).set({ stock: reward.stock - 1 }).where(eq(rewards.id, reward.id));
    await db.insert(pointHistory).values({ userId: user.id, delta: -reward.pointsCost, reason: `Tukar: ${reward.name}` });
    const [red] = await db
      .insert(redemptions)
      .values({ userId: user.id, rewardId: reward.id, rewardName: reward.name, pointsCost: reward.pointsCost, code })
      .returning();
    return Response.json({ ok: true, redemption: red, points: fresh.points - reward.pointsCost });
  } catch (err) {
    return errorResponse(err);
  }
}
