# CEID Co-Pilot

Demo Video: https://drive.google.com/file/d/1VRhObgY0mTojgfnc4kMzoYeB01BPOp-f/view?usp=sharing

Modern, mobile-responsive co-pilot for students and faculty at the Yale Center for Engineering Innovation and Design (CEID). Powered by the **xAI Grok API**, with **Yale CAS** account linking and role-based access (Student vs Faculty).

## Features

1. **Yale ID login** — Link a NetID via Yale CAS (or demo Student accounts until ITS registers the service; faculty via CAS / local simulated preview). Profiles live in Postgres.
2. **Home dashboard** — Post-login studio hub: equipment snapshot, materials search, hours/announcements, project shortcuts.
3. **Materials & Stock** — Live inventory synced from TouchNet uStore #239 (wood/acrylic catalog + floor overlays for fasteners/filament), with stock badges, SKUs, and “View / Buy on TouchNet” deep links.
4. **Floor Pulse & Snap-to-Diagnose** — Camera/upload a failed print; Grok Vision returns failure mode, root cause, and a fix checklist.
5. **Agentic DFM Router** — Fabrication plans across CEID stations with cert gates (students) or faculty override.
6. **Workshop & Cert Sniper** — Parse CEID newsletters, claim seats, download `.ics`.
7. **AI CAD Studio** — Natural-language STL edits with Three.js preview + download.
8. **Tool Sandbox** — Just-in-time interactive CEID machine training panels.
9. **Faculty Console** — RSVP roster, floor announcements, offline machine controls.

## Architecture (Home + Materials)

```
AppShell (nav + auth gate)
├── HomeDashboard          # default post-login view
│   ├── equipment widget → Floor Pulse
│   ├── materials search → MaterialsStock (shared query in CeidStore)
│   ├── hours / announcements (lib/materials.ts)
│   └── project / RSVP shortcuts → DFM, CAD, Sandbox, Certs
└── MaterialsStock
    ├── GET /api/materials/touchnet (server proxy + 5m cache / fallback)
    ├── sync badge: “Synced from TouchNet Store #239” + relative time + refresh
    ├── category filters + search
    ├── stock badges from TouchNet quantities (in / low / out)
    └── “View / Buy on TouchNet” deep links (mobile cards + desktop table)
```

Public TouchNet pages expose catalog, sizes, and pricing; exact remaining sheet counts are not always published, so quantities use sold-out detection plus CEID floor estimates with cache/fallback when scrape is rate-limited.

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
3. Until then, published users can use **Enter as Student** demo NetID only. Faculty roles come from CAS affiliations. Local simulated viewers may also demo faculty. Demo login is disabled when CAS is live, and cannot overwrite a CAS-linked account.

### Without an API key

API routes return rich **fallback** mocks. The header badge shows **Live Grok API** vs **Fallback mode**.

Photos, project text, and newsletter pastes are sent to xAI only when `XAI_API_KEY` is set (live mode).
