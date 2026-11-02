import { db } from "@/db";
import { transactions } from "@/db/schema";
import { errorResponse, requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(500);
    return Response.json({ transactions: rows });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const type = body.type === "expense" ? "expense" : "income";
    const category = String(body.category ?? "Lainnya").slice(0, 48);
    const amount = Math.floor(Number(body.amount));
    const description = String(body.description ?? "").slice(0, 300);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }
    const values: typeof transactions.$inferInsert = { type, category, amount, description };
    if (body.date) {
      const d = new Date(body.date);
      if (!Number.isNaN(d.getTime())) values.createdAt = d;
    }
    const [row] = await db.insert(transactions).values(values).returning();
    return Response.json({ ok: true, transaction: row });
  } catch (err) {
    return errorResponse(err);
  }
}
