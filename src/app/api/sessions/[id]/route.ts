import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, dbConfigured } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const sid = parseInt(id, 10);
  if (!Number.isFinite(sid)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db.select().from(sessions).where(eq(sessions.id, sid)).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
