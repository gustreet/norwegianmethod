import type { HomeTrack } from "./types";

export const TRACKS: HomeTrack[] = [
  {
    slug: "sha-tin-400",
    name: "Sha Tin oval",
    city: "Yuen Wo · 400 m",
    lat: 22.3873,
    lng: 114.1966,
    lapMeters: 400,
  },
  {
    slug: "kai-tak-400",
    name: "Kai Tak oval",
    city: "Kai Tak · 400 m",
    lat: 22.3244,
    lng: 114.1972,
    lapMeters: 400,
  },
];

export const HOME_TRACK = TRACKS[0];

export const TRACK_SAMPLE_TCX: Record<string, string> = {
  "sha-tin-400": "/samples/sha-tin.tcx",
  "kai-tak-400": "/samples/kai-tak.tcx",
};

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function trackBySlug(slug: string): HomeTrack | undefined {
  return TRACKS.find((t) => t.slug === slug);
}
