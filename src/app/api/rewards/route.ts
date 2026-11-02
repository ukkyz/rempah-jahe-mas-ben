import { db } from "@/db";
import { rewards } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(rewards).where(eq(rewards.isActive, true)).orderBy(asc(rewards.pointsCost));
  return Response.json({ rewards: rows });
}
