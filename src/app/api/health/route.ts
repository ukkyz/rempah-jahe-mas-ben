import { client, ensureSchema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    await client.execute("select 1");
    return Response.json({ ok: true, db: "sqlite/libsql" });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
