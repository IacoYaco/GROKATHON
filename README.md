# CEID Co-Pilot

Modern, mobile-responsive co-pilot for students at the Yale Center for Engineering Innovation and Design (CEID). Powered by the **xAI Grok API** for Snap-to-Diagnose (vision), Agentic DFM routing, and workshop/cert extraction from weekly emails.

## Features

1. **Floor Pulse & Snap-to-Diagnose** — Camera/upload a failed print; Grok Vision returns failure mode, root cause, and a fix checklist, then updates the crowdsourced machine grid.
2. **Agentic DFM Router** — Describe a project; Grok plans fabrication across CEID stations, flags DFM traps, locates Becton stock, and gates on your safety certs.
3. **Workshop & Cert Sniper** — Paste a messy CEID newsletter; Grok extracts trainings. Claim a spot and download a `.ics` calendar file.

Crowdsourced machine statuses, safety certifications, and RSVPs persist in `localStorage` (no database required).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `lucide-react` icons
- Official `openai` Node SDK pointed at `https://api.x.ai/v1`

## Setup

```bash
npm install
cp .env.example .env.local
# Add your key: XAI_API_KEY=xai-...
npm run dev -- --port 3456
```

Open [http://localhost:3456](http://localhost:3456).

### Without an API key

If `XAI_API_KEY` is missing, API routes return rich **fallback** mock responses so the UI never crashes. A header badge shows **Live Grok API** vs **Fallback mode**.

### Env vars

| Variable | Required | Default |
| --- | --- | --- |
| `XAI_API_KEY` | for live Grok | — |
| `GROK_VISION_MODEL` | no | `grok-2-vision-1212` |
| `GROK_TEXT_MODEL` | no | `grok-3-latest` |

`.env` / `.env.local` are gitignored — never commit your API key.

## Demo tips

- Toggle safety cert pills in the header to unlock/lock shops.
- Floor: **Load Sample Failed Print Photo**
- DFM: **Load Sample Project: Autonomous Drone Frame**
- Cert Sniper: **Paste Sample CEID Weekly Email**
