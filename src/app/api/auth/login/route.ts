import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, errorResponse, verifyPassword } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ error: "Email atau password salah" }, { status: 401 });
    }
    await createSession(user.id);
    return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role, points: user.points } });
  } catch (err) {
    return errorResponse(err);
  }
}
