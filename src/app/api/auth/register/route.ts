import { db } from "@/db";
import { pointHistory, users } from "@/db/schema";
import { createSession, errorResponse, hashPassword } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (name.length < 2) return Response.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Email tidak valid" }, { status: 400 });
    if (password.length < 6) return Response.json({ error: "Password minimal 6 karakter" }, { status: 400 });

    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (exists.length) return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });

    const WELCOME_POINTS = 25;
    const [user] = await db
      .insert(users)
      .values({ name, email, phone: phone || null, passwordHash: hashPassword(password), points: WELCOME_POINTS })
      .returning();
    await db.insert(pointHistory).values({ userId: user.id, delta: WELCOME_POINTS, reason: "Bonus selamat datang 🎉" });
    await createSession(user.id);
    return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role, points: user.points } });
  } catch (err) {
    return errorResponse(err);
  }
}
