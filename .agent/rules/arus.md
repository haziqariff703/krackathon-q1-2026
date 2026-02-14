---
trigger: always_on
---

# 🚀 AntiGravity Agent – Skills Definition

Project: Predictive Last-Mile Reliability System (Krackathon 2026)

---

## 🎯 Mission

Build a community-driven digital utility that reduces commuter stress for Malaysian public transport users by:

- Predicting bus delay reliability
- Measuring environmental discomfort (heat exposure)
- Recommending optimal departure decisions
- Quantifying measurable community impact

The agent must prioritize clarity, reliability, and demo stability over complexity.

---

# 🧠 Core Engineering Principles

1. **Solve one problem deeply** – reduce commuter uncertainty.
2. **Favor simple, reliable logic over complex AI.**
3. **Database integrity > feature quantity.**
4. **Frontend clarity > backend cleverness.**
5. **Every feature must map to measurable impact.**

---

# 🗄️ Database Skills (Supabase + PostGIS)

The agent must understand:

## 1. Spatial Awareness

- geometry(Point, 4326)
- geometry(LineString, 4326)
- GIST spatial indexing
- Basic distance queries
- Bounding box queries

## 2. Relational Integrity

- Proper foreign keys
- ON DELETE behavior
- NOT NULL constraints
- CHECK constraints
- Row Level Security (RLS)

## 3. Performance

- Indexing strategies
- Avoid unnecessary joins
- Avoid N+1 queries
- Efficient spatial filtering

## 4. Impact Tracking

The system must track:

- minutes_saved
- heat_minutes_avoided
- commuter_stress_score
- reliability_score

Agent must ensure all impact metrics are numeric, bounded, and consistent.

---

# 📊 Business Logic Skills

## 1. Reliability Score Logic

reliability_score = 1 - (delay_minutes / 30)

Clamp between 0 and 1.

## 2. Commuter Stress Score Formula

Base components:

- Delay impact (0–40 pts)
- Heat exposure (0–30 pts)
- Walking discomfort (0–20 pts)
- Safety risk (0–10 pts)

Final score must be between 0 and 100.

Lower score = better commuter condition.

## 3. Decision Recommendation Logic

If:

- reliability_score < 0.6 → Suggest delayed departure
- delay_minutes > 20 → Suggest alternative transport
- heat_index > 33°C → Suggest sheltered path

Agent must prioritize actionable output.

---

# 🖥️ Frontend Skills (Next.js + Map)

Agent must:

- Integrate Supabase client properly
- Handle authentication
- Fetch spatial data efficiently
- Render map with:
  - Transit stops
  - Community paths
  - Safety zones
- Display:
  - Stress score
  - Reliability %
  - Minutes saved

Avoid heavy animation.
Prioritize clarity.

---

# 🔐 Security Skills

Agent must:

- Respect RLS policies
- Never bypass auth checks
- Validate user ownership before updates
- Sanitize user-generated content

---

# 📈 Demo Optimization Skills

For hackathon:

- Ensure at least one fully working demo route
- Preload sample transit data
- Simulate delay updates if real-time data unavailable
- Guarantee stable demo even offline

Agent must prefer deterministic demo behavior over live dependency risk.

---

# 🧪 Testing Skills

Agent must test:

- Insert trip_log flow
- Reliability score updates
- Stress score calculation
- Spatial query accuracy
- RLS enforcement

---

# 🚫 Anti-Patterns (Do Not Do)

- Do not over-engineer AI models
- Do not add microservices
- Do not introduce unnecessary abstractions
- Do not build features without measurable impact
- Do not sacrifice demo reliability for complexity

---

# 🏆 Success Criteria

The system must demonstrate:

1. A clear real-world commuter problem
2. Predictive reliability tracking
3. Measurable stress reduction
4. Spatial intelligence
5. Clean and stable live demo

If the feature does not contribute to these 5 pillars, it should not be built.

---

# 🧭 Agent Behavior Priority Order

1. Stability
2. Clarity
3. Measurable impact
4. Performance
5. Innovation

Innovation is last — not first.

---

End of skills definition.
