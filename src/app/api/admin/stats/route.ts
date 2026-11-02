import { db } from "@/db";
import { orderItems, orders, transactions, users } from "@/db/schema";
import { errorResponse, requireAdmin } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const [totals] = await db
      .select({
        income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
        expense: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions);

    const daily = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${transactions.createdAt}), 'YYYY-MM-DD')`,
        income: sql<number>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
        expense: sql<number>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .where(sql`${transactions.createdAt} >= now() - interval '14 days'`)
      .groupBy(sql`date_trunc('day', ${transactions.createdAt})`)
      .orderBy(sql`date_trunc('day', ${transactions.createdAt})`);

    const byCategory = await db
      .select({
        type: transactions.type,
        category: transactions.category,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .groupBy(transactions.type, transactions.category)
      .orderBy(desc(sql`sum(${transactions.amount})`));

    const topProducts = await db
      .select({
        name: orderItems.productName,
        qty: sql<number>`sum(${orderItems.qty})`,
        revenue: sql<number>`sum(${orderItems.qty} * ${orderItems.price})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(sql`${orders.status} <> 'batal'`)
      .groupBy(orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.qty})`))
      .limit(6);

    const [orderStats] = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
        diproses: sql<number>`count(*) filter (where ${orders.status} = 'diproses')`,
        siap: sql<number>`count(*) filter (where ${orders.status} = 'siap')`,
        selesai: sql<number>`count(*) filter (where ${orders.status} = 'selesai')`,
      })
      .from(orders);

    const [customerStats] = await db
      .select({
        total: sql<number>`count(*) filter (where ${users.role} = 'customer')`,
        pointsOutstanding: sql<number>`coalesce(sum(${users.points}), 0)`,
      })
      .from(users);

    const topCustomers = await db
      .select({ name: users.name, points: users.points, totalSpent: users.totalSpent })
      .from(users)
      .where(eq(users.role, "customer"))
      .orderBy(desc(users.totalSpent))
      .limit(5);

    const n = (v: unknown) => Number(v ?? 0);
    return Response.json({
      income: n(totals.income),
      expense: n(totals.expense),
      profit: n(totals.income) - n(totals.expense),
      daily: daily.map((d) => ({ day: d.day, income: n(d.income), expense: n(d.expense) })),
      byCategory: byCategory.map((c) => ({ ...c, total: n(c.total) })),
      topProducts: topProducts.map((p) => ({ ...p, qty: n(p.qty), revenue: n(p.revenue) })),
      orders: { total: n(orderStats.total), pending: n(orderStats.pending), diproses: n(orderStats.diproses), siap: n(orderStats.siap), selesai: n(orderStats.selesai) },
      customers: { total: n(customerStats.total), pointsOutstanding: n(customerStats.pointsOutstanding) },
      topCustomers,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
