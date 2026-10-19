import type { Lap, TrackPoint } from "./types";

const TCX = "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2";
const TPX = "http://www.garmin.com/xmlschemas/ActivityExtension/v2";

function childText(parent: Element, ns: string, local: string): string {
  const el = parent.getElementsByTagNameNS(ns, local)[0];
  return el?.textContent?.trim() ?? "";
}

function parseLaps(activity: Element): Lap[] {
  const lapEls = activity.getElementsByTagNameNS(TCX, "Lap");
  const laps: Lap[] = [];

  for (let i = 0; i < lapEls.length; i++) {
    const lap = lapEls[i];
    const tpx = lap.getElementsByTagNameNS(TPX, "TPX")[0];
    let cadence: number | null = null;
    let watts: number | null = null;
    if (tpx) {
      const cadRaw = childText(tpx, TPX, "AvgRunCadence");
      const wattsRaw = childText(tpx, TPX, "AvgWatts");
      if (cadRaw) cadence = Math.round(parseFloat(cadRaw) * 2);
      if (wattsRaw) watts = Math.round(parseFloat(wattsRaw));
    }

    const hrEls = lap.getElementsByTagNameNS(TCX, "HeartRateBpm");
    let endHr: number | null = null;
    if (hrEls.length > 0) {
      const v = childText(hrEls[hrEls.length - 1], TCX, "Value");
      endHr = v ? parseInt(v, 10) : null;
    }

    const avgHrEl = lap.getElementsByTagNameNS(TCX, "AverageHeartRateBpm")[0];
    const maxHrEl = lap.getElementsByTagNameNS(TCX, "MaximumHeartRateBpm")[0];

    laps.push({
      n: i + 1,
      seconds: parseFloat(childText(lap, TCX, "TotalTimeSeconds") || "0"),
      meters: parseFloat(childText(lap, TCX, "DistanceMeters") || "0"),
      avgHr: avgHrEl
        ? parseInt(childText(avgHrEl, TCX, "Value") || "0", 10)
        : 0,
      maxHr: maxHrEl
        ? parseInt(childText(maxHrEl, TCX, "Value") || "0", 10)
        : 0,
      endHr,
      cadence,
      watts,
    });
  }

  return laps;
}

function parseTrackpoints(activity: Element, maxPoints = 800): TrackPoint[] {
  const tpEls = activity.getElementsByTagNameNS(TCX, "Trackpoint");
  const raw: TrackPoint[] = [];

  for (let i = 0; i < tpEls.length; i++) {
    const tp = tpEls[i];
    const pos = tp.getElementsByTagNameNS(TCX, "Position")[0];
    if (!pos) continue;
    const lat = parseFloat(childText(pos, TCX, "LatitudeDegrees"));
    const lng = parseFloat(childText(pos, TCX, "LongitudeDegrees"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const time = childText(tp, TCX, "Time");
    const hrEl = tp.getElementsByTagNameNS(TCX, "HeartRateBpm")[0];
    const hrRaw = hrEl ? childText(hrEl, TCX, "Value") : "";
    const tpx = tp.getElementsByTagNameNS(TPX, "TPX")[0];
    const speedRaw = tpx ? childText(tpx, TPX, "Speed") : "";

    raw.push({
      lat,
      lng,
      time,
      hr: hrRaw ? parseInt(hrRaw, 10) : null,
      speedMps: speedRaw ? parseFloat(speedRaw) : null,
    });
  }

  if (raw.length <= maxPoints) return raw;
  const step = Math.ceil(raw.length / maxPoints);
  return raw.filter((_, i) => i % step === 0);
}

export type ParsedTcx = {
  startedAt: string | null;
  laps: Lap[];
  trackpoints: TrackPoint[];
};

export function parseTcx(xml: string): ParsedTcx {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const activity = doc.getElementsByTagNameNS(TCX, "Activity")[0];
  if (!activity) {
    throw new Error("No Activity found in this TCX file.");
  }

  const startedAt = childText(activity, TCX, "Id") || null;
  return {
    startedAt,
    laps: parseLaps(activity),
    trackpoints: parseTrackpoints(activity),
  };
}
