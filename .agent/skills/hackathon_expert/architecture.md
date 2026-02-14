# 🏗️ Architecture Document

Project: AntiGravity – Predictive Last-Mile Reliability System

---

# 1. System Overview

Frontend:

- Next.js (App Router)
- Supabase JS Client
- Map rendering (Leaflet or Mapbox)

Backend:

- Supabase (Postgres + PostGIS)
- Row Level Security
- Indexed spatial queries

No separate backend server required.

Architecture prioritizes simplicity and stability.

---

# 2. High-Level Architecture

User
↓
Next.js Frontend
↓
Supabase Client SDK
↓
Postgres + PostGIS
↓
Spatial + Relational Data

---

# 3. Database Structure

Core Tables:

- profiles
- transit_stops
- community_paths
- safety_reports
- trip_logs

System Table:

- spatial_ref_sys (PostGIS internal)

All geometry uses SRID 4326.

---

# 4. Core Data Flow

## A. Transit Update Flow

1. Transit stop delay updated
2. reliability_score recalculated
3. Frontend subscribes to changes
4. UI updates reliability display

---

## B. Trip Logging Flow

1. User starts trip
2. Delay + heat data captured
3. commuter_stress_score calculated
4. trip_logs entry inserted
5. profile aggregate metrics updated

---

## C. Stress Score Computation

Inputs:

- delay_minutes
- heat_index
- walking time
- safety risk

Output:

- commuter_stress_score (0–100)

Lower = better commuting condition.

Calculation performed in frontend or service layer.

---

# 5. Spatial Logic

Use PostGIS for:

- Nearest transit stop queries
- Path bounding box filtering
- Safety zone proximity detection

All spatial columns indexed with GIST.

---

# 6. Indexing Strategy

Spatial:

- GIST on geometry columns

Relational:

- Index on trip_logs.user_id
- Index on trip_logs.stop_id
- Index on safety_reports.expires_at

Ensures demo responsiveness.

---

# 7. Security Model

- RLS enabled on user-owned tables
- Users can only modify their own data
- Safety reports insert-only
- No direct table exposure without auth

---

# 8. Scalability Considerations

Designed for:

- Demo-scale
- City-level pilot

Future scale options:

- Background workers for delay calculation
- Materialized views for analytics
- Cached reliability computation

Not required for hackathon phase.

---

# 9. Failure Tolerance

If real-time feed fails:

- Use simulated delay data
- Continue stress score demonstration
- Never block demo on API dependency

---

# 10. Architectural Philosophy

- Keep layers thin
- Keep logic deterministic
- Avoid unnecessary services
- Optimize for clarity
- Optimize for demo stability

This system must feel reliable.

Reliability of the system demonstrates the reliability it promotes.

---

End of architecture.
