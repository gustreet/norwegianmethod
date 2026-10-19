import type { HomeTrack } from "./types";

/** Your usual 400 m oval — center from Garmin TCX (New Territories area, HK). */
export const HOME_TRACK: HomeTrack = {
  slug: "home-400",
  name: "Home track",
  city: "Sha Tin · 400 m oval",
  lat: 22.3873,
  lng: 114.1966,
  lapMeters: 400,
};

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
