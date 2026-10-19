# Norwegian Singles Review

A small Next.js app that reads a **Garmin TCX** export and judges a track session against **Norwegian Singles** (James Copeland): sub-threshold effort, LTHR guardrail, pace drift, and recovery heat—not Garmin’s VO2max label or execution score.

## Run locally

```bash
npm install
npm run dev -- --port 4317
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). The sample session is your uploaded `activity_24729105034.tcx`. Use **Upload TCX** for another file.

Set **LTHR** to your lactate-threshold heart rate (field test: avg HR in the last 20 minutes of a 30-minute solo time trial).

## What it does better than Garmin Connect

- Verdict: on-method / borderline / too hard for a Norwegian Single
- Rep table with pace fade and reps that crossed LTHR
- Explicit contrast with Garmin’s “VO2 Max” primary benefit on the same workout

TCX is parsed in the browser; nothing is uploaded to a server.
