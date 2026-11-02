import { getCurrentUser, levelFor } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const user = await getCurrentUser();
    if (!user) return Response.json({ user: null });
    return Response.json({ user: { ...user, level: levelFor(user.points, user.totalSpent) } });
  } catch {
    return Response.json({ user: null });
  }
}
