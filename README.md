# Norwegian Method (`norwegianmethod`)

**Singles Track** is a track-first Next.js app for your 400 m oval: **OpenStreetMap** GPS from Garmin TCX, **Norwegian Singles** (Copeland) scoring, and **Marius Bakken** notes on controlled 400s. Session summaries persist on **Neon** Postgres.

## GitHub

Create the repo (if it does not exist yet), then push this project:

```bash
gh repo create norwegianmethod --public --source=. --remote=github --push
```

Or add a remote manually:

```bash
git remote add github git@github.com:<your-user>/norwegianmethod.git
git push -u github main
```

## Run locally

```bash
npm install
cp .env.example .env.local   # optional: Neon DATABASE_URL (pooled)
npm run db:push              # when DATABASE_URL is set
npm run dev -- --port 4317
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

- **Track** — OSM map of your loop (demo loads `public/demo.tcx`), upload TCX, rep table, save to Neon.
- **Sessions** — history from Neon.
- **Method** — short Copeland + Bakken copy tied to your home track.

## Neon

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string into `.env.local` as `DATABASE_URL`.
3. Run `npm run db:push`.

Without Neon, the app still parses TCX and draws the map in the browser; **Save to Neon** will explain that the database is missing.

## Your track

Default map center matches your exported TCX (Sha Tin area). Upload any session from that oval; the app checks whether GPS centroid is near home.

## Stack

Next.js 16, Tailwind 4, Leaflet + OpenStreetMap tiles, Drizzle ORM, `@neondatabase/serverless`.
