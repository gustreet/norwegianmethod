import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, dbConfigured } from "@/lib/db";
import { sessions, tracks } from "@/lib/db/schema";
import { TRACKS, trackBySlug } from "@/lib/track-config";

export async function GET() {
  if (!dbConfigured()) {
    return NextResponse.json({ sessions: [], db: false });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ sessions: [], db: false });

  const rows = await db
    .select({
      id: sessions.id,
      trackSlug: sessions.trackSlug,
      startedAt: sessions.startedAt,
      verdict: sessions.verdict,
      qualityMinutes: sessions.qualityMinutes,
      workRepCount: sessions.workRepCount,
      avgWorkPaceMinKm: sessions.avgWorkPaceMinKm,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .orderBy(desc(sessions.createdAt));

  return NextResponse.json({ sessions: rows, db: true });
}

export async function POST(req: Request) {
  if (!dbConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set. Add Neon pooled URL to .env.local." },
      { status: 503 },
    );
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = await req.json();
  const {
    trackSlug,
    startedAt,
    lthr,
    verdict,
    qualityMinutes,
    workRepCount,
    avgWorkPaceMinKm,
    paceDriftPct,
    avgWorkHr,
    laps,
    analysis,
    route,
  } = body;

  if (!trackSlug || !laps || !analysis || !route || !verdict) {
    return NextResponse.json({ error: "Missing session payload" }, { status: 400 });
  }

  const track = trackBySlug(trackSlug);
  if (!track) {
    return NextResponse.json({ error: "Unknown track" }, { status: 400 });
  }

  for (const t of TRACKS) {
    await db
      .insert(tracks)
      .values({
        slug: t.slug,
        name: t.name,
        city: t.city,
        centerLat: t.lat,
        centerLng: t.lng,
        lapMeters: t.lapMeters,
      })
      .onConflictDoNothing({ target: tracks.slug });
  }

  const [row] = await db
    .insert(sessions)
    .values({
      trackSlug,
      startedAt: startedAt ? new Date(startedAt) : null,
      lthr,
      verdict,
      qualityMinutes,
      workRepCount,
      avgWorkPaceMinKm,
      paceDriftPct,
      avgWorkHr,
      laps,
      analysis,
      route,
    })
    .returning({ id: sessions.id });

  return NextResponse.json({ id: row.id });
}
