import {
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: text("name").notNull(),
  city: text("city"),
  centerLat: real("center_lat").notNull(),
  centerLng: real("center_lng").notNull(),
  lapMeters: real("lap_meters").notNull().default(400),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  trackSlug: varchar("track_slug", { length: 64 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  lthr: real("lthr").notNull(),
  verdict: varchar("verdict", { length: 32 }).notNull(),
  qualityMinutes: real("quality_minutes").notNull(),
  workRepCount: real("work_rep_count").notNull(),
  avgWorkPaceMinKm: real("avg_work_pace_min_km"),
  paceDriftPct: real("pace_drift_pct"),
  avgWorkHr: real("avg_work_hr"),
  laps: jsonb("laps").notNull(),
  analysis: jsonb("analysis").notNull(),
  route: jsonb("route").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
