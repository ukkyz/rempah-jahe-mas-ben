import { db } from "@/db";
import { transactions } from "@/db/schema";
import { errorResponse, requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    await db.delete(transactions).where(eq(transactions.id, Number(id)));
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
