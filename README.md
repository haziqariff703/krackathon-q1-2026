# Arus — Last-Mile Reliability Engine

Arus is a Next.js + Supabase app for simulating urban last-mile transit reliability with live community signals (incidents, upvotes, community paths, and system stats).

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Supabase (Postgres, Realtime, RLS)
- PostGIS (geometry/geography queries)
- Leaflet / React-Leaflet
- Tailwind CSS

## Core Features

- Route simulation from selected origin/destination.
- Nearby stops from database via RPC (`get_nearby_stops`) with real reliability mapping.
- Live incident feed (transit / heat / safety) with realtime updates.
- Community upvotes persisted in `report_upvotes`.
- Active community path selection (`community_paths` fallback to `sheltered_paths`) with realtime updates.
- System stats based on live tables (`incident_reports`, `route_simulations`, `transit_stops`).
- Impact page fed by realtime impact calculations.

## Pages

- `/` Main map + route simulation + nearby stops + report modal
- `/community` Live incident/community portal
- `/safety` Safety reporting and status
- `/impact` Realtime impact dashboard
- `/explore` Additional exploration view

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run app

```bash
npm run dev
```

4. Production check (recommended before demo/submission)

```bash
npm run build
npm run start
```

## Database Setup (Supabase SQL Editor)

Run migrations in `supabase/migrations` in filename order:

1. `20260214_initial_schema.sql`
2. `20260214_backend_expansion.sql`
3. `20260214_report_enhancements.sql`
4. `20260214_report_upvotes_policies.sql`
5. `20260214_route_simulation_backend.sql`
6. `20260214_system_stats.sql`
7. `20260214_upvote_trigger_hardening.sql`
8. `20260215_community_paths_seed.sql`

Required extensions:

- `pgcrypto`
- `uuid-ossp`
- `postgis`

## Main Tables / Functions Used

- `public.transit_stops`
- `public.route_simulations`
- `public.incident_reports`
- `public.report_upvotes`
- `public.community_paths`
- `public.sheltered_paths`
- `public.commuter_impact`
- `public.get_nearby_stops(...)`
- `public.simulate_route(...)` (optional backend simulation RPC)

## Realtime Channels

- Incident updates (`incident_reports`, `report_upvotes`)
- Active community path updates (`community_paths`, `sheltered_paths`)
- System stats updates (`incident_reports`, `route_simulations`, `transit_stops`)
- Impact updates (`trip_logs`, `commuter_impact`)

## Known Limitations

- Route geometry can still use demo/fallback route building for unmatched OD pairs.
- Live vehicle positions are currently mock-driven.
- Nearby stop wait time is currently simulated (reliability is real from DB).
- Linting still includes some existing non-blocking project issues outside core demo flow.

## Submission Notes

For judging/demo, ensure:

- Supabase env vars are set.
- Migrations are applied.
- At least a few rows exist in `transit_stops`, `incident_reports`, and `community_paths`.
- You run `npm run build` successfully before presenting.
