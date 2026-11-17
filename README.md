# CEID Co-Pilot

Modern, mobile-responsive co-pilot for students and faculty at the Yale Center for Engineering Innovation and Design (CEID). Powered by the **xAI Grok API**, with **Yale CAS** account linking and role-based access (Student vs Faculty).

## Features

1. **Yale ID login** — Link a NetID via Yale CAS (or demo Student/Faculty accounts until ITS registers the service). Profiles live in Postgres.
2. **Floor Pulse & Snap-to-Diagnose** — Camera/upload a failed print; Grok Vision returns failure mode, root cause, and a fix checklist.
3. **Agentic DFM Router** — Fabrication plans across CEID stations with cert gates (students) or faculty override.
4. **Workshop & Cert Sniper** — Parse CEID newsletters, claim seats, download `.ics`.
5. **Faculty Console** — RSVP roster, floor announcements, offline machine controls.

## Roles

| Capability | Student | Faculty |
| --- | --- | --- |
| Diagnose / DFM / Cert Sniper | Yes | Yes |
| Crowdsource machine status | Yes | Yes |
| Mark machines Offline | — | Yes |
| Skip cert gate blockers | — | Yes |
| RSVP roster + announcements | — | Yes |

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Three.js glossy orb (Unseen-inspired depth)
- Postgres (`DATABASE_URL` on publish) with PGlite locally
- `openai` SDK → `https://api.x.ai/v1`

## Setup

```bash
npm install
cp .env.example .env.local
# Add XAI_API_KEY=...
npm run dev
```

### Yale CAS

1. Register the service URL with Yale ITS: `https://<host>/api/auth/cas/callback`
2. Set `YALE_CAS_ENABLED=true` (and optional `YALE_CAS_BASE_URL`)
3. Until then, use **Enter as Student** / **Enter as Faculty** demo NetIDs on the login gate

### Without an API key

API routes return rich **fallback** mocks. The header badge shows **Live Grok API** vs **Fallback mode**.

Photos, project text, and newsletter pastes are sent to xAI only when `XAI_API_KEY` is set (live mode).
