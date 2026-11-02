import { db } from "@/db";
import { orderItems, orders, pointHistory, products, users } from "@/db/schema";
import { errorResponse, requireUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

const POINTS_PER_RUPIAH = 1 / 1000; // 1 poin per Rp1.000
const RUPIAH_PER_POINT = 100; // 1 poin = Rp100 potongan

export async function GET() {
  try {
    await ensureSeeded();
    const user = await requireUser();
    const list =
      user.role === "admin"
        ? await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200)
        : await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
    const ids = list.map((o) => o.id);
    const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
    const result = list.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
    return Response.json({ orders: result });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const user = await requireUser();
    const body = await req.json();
    const cart = (body.items ?? []) as { productId: number; qty: number }[];
    const usePoints = Math.max(0, Math.floor(Number(body.usePoints ?? 0)));
    const pickupType = body.pickupType === "antar" ? "antar" : "ambil";
    const note = String(body.note ?? "").slice(0, 300);

    if (!cart.length) return Response.json({ error: "Keranjang kosong" }, { status: 400 });

    const prodRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, cart.map((c) => c.productId)));
    const lines = cart
      .map((c) => {
        const p = prodRows.find((x) => x.id === c.productId);
        if (!p) return null;
        const qty = Math.min(20, Math.max(1, Math.floor(c.qty)));
        return { productId: p.id, productName: p.name, qty, price: p.price };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    if (!lines.length) return Response.json({ error: "Produk tidak ditemukan" }, { status: 400 });

    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const [fresh] = await db.select().from(users).where(eq(users.id, user.id));
    const maxByBalance = fresh.points;
    const maxByHalf = Math.floor((subtotal * 0.5) / RUPIAH_PER_POINT);
    const pointsUsed = Math.min(usePoints, maxByBalance, maxByHalf);
    const discount = pointsUsed * RUPIAH_PER_POINT;
    const total = subtotal - discount;
    const bigOrderBonus = total >= 50000 ? 10 : 0;
    const pointsEarned = Math.floor(total * POINTS_PER_RUPIAH) + bigOrderBonus;

    const [order] = await db
      .insert(orders)
      .values({
        userId: user.id,
        customerName: user.name,
        subtotal,
        discount,
        total,
        pointsEarned,
        pointsUsed,
        pickupType,
        note: note || null,
      })
      .returning();
    await db.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));

    const delta = pointsEarned - pointsUsed;
    await db
      .update(users)
      .set({ points: fresh.points + delta, totalSpent: fresh.totalSpent + total })
      .where(eq(users.id, user.id));
    if (pointsUsed > 0) {
      await db.insert(pointHistory).values({ userId: user.id, delta: -pointsUsed, reason: `Potongan pesanan #${order.id}` });
    }
    if (pointsEarned > 0) {
      await db.insert(pointHistory).values({
        userId: user.id,
        delta: pointsEarned,
        reason: `Belanja pesanan #${order.id}${bigOrderBonus ? " (+bonus belanja ≥50rb)" : ""}`,
      });
    }

    return Response.json({ ok: true, order: { ...order, items: lines }, pointsEarned, pointsUsed });
  } catch (err) {
    return errorResponse(err);
  }
}
