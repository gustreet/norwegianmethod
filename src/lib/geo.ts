import type { HomeTrack, TrackPoint } from "./types";
import { TRACKS } from "./track-config";

export function trackCentroid(points: TrackPoint[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / points.length, lng: lng / points.length };
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** True if activity GPS is near a known oval (within ~600 m). */
export function nearTrack(
  points: TrackPoint[],
  center: { lat: number; lng: number },
  radiusM = 600,
): boolean {
  const c = trackCentroid(points);
  if (!c) return false;
  return distanceMeters(c, center) <= radiusM;
}

/** Pick the closest configured track to this activity GPS. */
export function detectTrack(points: TrackPoint[], radiusM = 800): HomeTrack | null {
  const c = trackCentroid(points);
  if (!c) return null;
  let best: HomeTrack | null = null;
  let bestD = Infinity;
  for (const t of TRACKS) {
    const d = distanceMeters(c, { lat: t.lat, lng: t.lng });
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return bestD <= radiusM ? best : null;
}
