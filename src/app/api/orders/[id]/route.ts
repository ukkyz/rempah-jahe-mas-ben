import { db } from "@/db";
import { orders, pointHistory, transactions, users } from "@/db/schema";
import { errorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "diproses", "siap", "selesai", "batal"] as const;

async function cancelOrder(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || order.status === "batal") return order;
  const [u] = await db.select().from(users).where(eq(users.id, order.userId));
  const delta = order.pointsUsed - order.pointsEarned;
  await db
    .update(users)
    .set({ points: Math.max(0, u.points + delta), totalSpent: Math.max(0, u.totalSpent - order.total) })
    .where(eq(users.id, u.id));
  if (delta !== 0) {
    await db.insert(pointHistory).values({ userId: u.id, delta, reason: `Pembatalan pesanan #${order.id}` });
  }
  if (order.status === "selesai") {
    await db.delete(transactions).where(eq(transactions.orderId, order.id));
  }
  const [updated] = await db.update(orders).set({ status: "batal" }).where(eq(orders.id, orderId)).returning();
  return updated;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const orderId = Number(id);
    const body = await req.json();
    const status = String(body.status ?? "");
    if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
      return Response.json({ error: "Status tidak valid" }, { status: 400 });
    }
    const user = await requireUser();

    if (user.role !== "admin") {
      // customers may only cancel their own pending orders
      if (status !== "batal") return Response.json({ error: "Tidak diizinkan" }, { status: 403 });
      const [own] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, user.id)));
      if (!own) return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
      if (own.status !== "pending") return Response.json({ error: "Pesanan sudah diproses" }, { status: 400 });
      const updated = await cancelOrder(orderId);
      return Response.json({ ok: true, order: updated });
    }

    await requireAdmin();
    if (status === "batal") {
      const updated = await cancelOrder(orderId);
      return Response.json({ ok: true, order: updated });
    }
    const [current] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!current) return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    if (status === "selesai" && current.status !== "selesai") {
      await db.insert(transactions).values({
        type: "income",
        category: "Penjualan Online",
        amount: current.total,
        description: `Pesanan #${current.id} — ${current.customerName}`,
        orderId: current.id,
      });
    }
    if (current.status === "selesai" && status !== "selesai") {
      await db.delete(transactions).where(eq(transactions.orderId, current.id));
    }
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, orderId)).returning();
    return Response.json({ ok: true, order: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
