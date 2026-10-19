"use client";

import { MapContainer, Polyline, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { TrackPoint } from "@/lib/types";
import { HOME_TRACK, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/track-config";
import "leaflet/dist/leaflet.css";

type Props = {
  points: TrackPoint[];
  center?: { lat: number; lng: number };
  highlight?: "pace" | "hr";
};

function FitBounds({ points }: { points: TrackPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [48, 48], maxZoom: 18 },
    );
  }, [map, points]);
  return null;
}

function paceColor(speedMps: number | null): string {
  if (speedMps == null || speedMps < 0.5) return "#94a3b8";
  const paceMinKm = 1000 / speedMps / 60;
  if (paceMinKm < 4.2) return "#BA0C2F";
  if (paceMinKm < 4.6) return "#00205B";
  if (paceMinKm < 5.2) return "#1e5a8a";
  return "#64748b";
}

export function TrackMap({ points, center, highlight = "pace" }: Props) {
  const c = center ?? HOME_TRACK;
  const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

  if (points.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--muted)]">
        Upload a TCX from your track to draw the loop on OpenStreetMap.
      </div>
    );
  }

  return (
    <MapContainer
      center={[c.lat, c.lng]}
      zoom={17}
      className="h-full min-h-[360px] w-full rounded-2xl z-0"
      scrollWheelZoom
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <FitBounds points={points} />
      {highlight === "pace" && points.length > 1
        ? points.slice(1).map((p, i) => {
            const prev = points[i];
            return (
              <Polyline
                key={`${p.time}-${i}`}
                positions={[[prev.lat, prev.lng], [p.lat, p.lng]]}
                pathOptions={{
                  color: paceColor(p.speedMps ?? prev.speedMps),
                  weight: 5,
                  opacity: 0.85,
                }}
              />
            );
          })
        : (
          <Polyline positions={latlngs} pathOptions={{ color: "#00205B", weight: 4 }} />
        )}
      <CircleMarker
        center={[points[0].lat, points[0].lng]}
        radius={6}
        pathOptions={{ color: "#fff", fillColor: "#00205B", fillOpacity: 1, weight: 2 }}
      />
      <CircleMarker
        center={[points[points.length - 1].lat, points[points.length - 1].lng]}
        radius={6}
        pathOptions={{ color: "#fff", fillColor: "#BA0C2F", fillOpacity: 1, weight: 2 }}
      />
    </MapContainer>
  );
}
