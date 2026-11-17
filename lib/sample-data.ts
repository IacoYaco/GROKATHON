import type { Machine, SafetyCert } from "@/types/ceid";

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

export const DEFAULT_CERTS: SafetyCert[] = [
  { id: "laser_cutter", label: "Laser Cutter", unlocked: true },
  { id: "3d_printing", label: "3D Printing", unlocked: true },
  { id: "woodshop", label: "Woodshop", unlocked: false },
  { id: "metal_shop", label: "Metal Shop", unlocked: false },
];

export const DEFAULT_MACHINES: Machine[] = [
  {
    id: "prusa-1",
    name: "Prusa MK4 #1",
    category: "3d_printer",
    status: "free",
    material: "PLA — Galaxy Black",
    reportedAt: minutesAgo(4),
  },
  {
    id: "prusa-2",
    name: "Prusa MK4 #2",
    category: "3d_printer",
    status: "in_use",
    material: "PETG — Clear",
    reportedAt: minutesAgo(18),
  },
  {
    id: "prusa-3",
    name: "Prusa MK4 #3",
    category: "3d_printer",
    status: "free",
    material: "PLA — Yale Blue",
    reportedAt: minutesAgo(42),
  },
  {
    id: "prusa-4",
    name: "Prusa MK4 #4",
    category: "3d_printer",
    status: "issue",
    material: "PLA — White",
    reportedAt: minutesAgo(95),
    note: "Layer shift reported earlier today",
  },
  {
    id: "bambu-1",
    name: "Bambu Lab X1C #1",
    category: "3d_printer",
    status: "in_use",
    material: "ABS — Matte Black",
    reportedAt: minutesAgo(12),
  },
  {
    id: "bambu-2",
    name: "Bambu Lab X1C #2",
    category: "3d_printer",
    status: "free",
    material: "PETG — Orange",
    reportedAt: minutesAgo(7),
  },
  {
    id: "epilog-1",
    name: "Epilog Laser Cutter #1",
    category: "laser",
    status: "free",
    material: "3mm Birch plywood staged",
    reportedAt: minutesAgo(25),
  },
  {
    id: "epilog-2",
    name: "Epilog Laser Cutter #2",
    category: "laser",
    status: "offline",
    material: "—",
    reportedAt: minutesAgo(180),
    note: "Exhaust interlock fault — staff notified",
  },
  {
    id: "study-room",
    name: "Becton Study Room",
    category: "room",
    status: "free",
    material: "Whiteboard + 6 seats",
    reportedAt: minutesAgo(55),
  },
];

export const MACHINE_OPTIONS = DEFAULT_MACHINES.filter(
  (m) => m.category !== "room"
).map((m) => ({ id: m.id, name: m.name }));

export const SAMPLE_DFM_PROJECT = `Autonomous quadrotor drone frame for ENAS 118.

Constraints:
- Max takeoff weight under 850g including 4S 1800mAh pack
- Arms must survive 2m tip-over on tile
- Motor mounts for 2207 motors (16×19mm hole pattern)
- Center plate needs 30×30mm flight-controller standoffs
- Prefer CEID stock: birch plywood, Delrin, PETG, 6061 scrap if available
- Overall span ≈ 280mm motor-to-motor
- Need quick swap arms if one cracks

I have rough CAD and can laser-cut flat parts. Want a fabrication sequence that uses CEID stations this week.`;

export const SAMPLE_NEWSLETTER = `From: CEID Student Staff <ceid.staff@yale.edu>
To: ceid-list@mailman.yale.edu
Subject: CEID Weekly — trainings, open hours, and a reminder about filament

Hey makers —

Quick dump before midterms chaos:

OPEN HOURS
Mon–Thu 12–10pm, Fri 12–6pm. Weekend hours TBD depending on staff coverage (check Slack #ceid-floor).

*** IMPORTANT SAFETY NOTE ***
If you haven't done Laser Cutter Level 1 since Fall orientation, you need a refresher before booking Epilog #1 or #2. Book via the usual form.

--- WOODSHOP SAFETY TRAINING ---
When: Wednesday March 19, 6:00–8:00 PM
Where: Becton 102 (meet by the plywood racks, not the main lobby)
Seats: 8 remaining of 12
Prereq: closed-toe shoes; bring Yalies ID
This session GRANTS Woodshop certification. No metal tools covered.

Also floating around: Metal Shop intro is finally back!!
Title: Intro to Metal Shop & Mill Safety
Date/Time: Thursday March 20 @ 5:30pm–7:30pm
Location: Becton 015 (basement shop — use the stairwell by the loading dock)
Capacity: 6 seats left (10 total)
Prerequisites: Woodshop cert recommended but not required; long pants + closed-toe shoes required.
Grants: Metal Shop 🔒 unlock after attendance + quiz.

3D Printing office hours (no cert granted, just help):
Tue 4–6pm at the Prusa cluster. Bring failed prints.

Laser Cutter Advanced (kerf + acrylic welding):
Fri March 21, 1:00–2:30 PM — Becton 110. 4 seats left. Requires Laser Cutter ✓ already.
Does NOT grant a new cert, just advanced tips.

Filament note: PETG orange is low on X1C #2 — restock arriving Monday. Don't leave ABS open overnight.

Questions → #ceid-help or stop by the desk.

— CEID staff
P.S. Someone left a half-cut Delrin sheet on Laser #1. Claim by Friday or it goes to scrap.`;

/** Tiny generated PNG used as a stand-in "failed print" sample (no external asset). */
export function getSampleFailedPrintDataUrl(): string {
  // 64x64 reddish "failed print" placeholder as a data URL PNG
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = "#4a5568";
      ctx.fillRect(40, 40, 240, 160);
      // layer lines
      for (let y = 50; y < 190; y += 6) {
        ctx.strokeStyle = y % 18 === 0 ? "#e53e3e" : "#718096";
        ctx.lineWidth = y % 18 === 0 ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(50, y + (y > 120 ? (y - 120) * 0.15 : 0));
        ctx.lineTo(270, y);
        ctx.stroke();
      }
      // spaghetti blob
      ctx.fillStyle = "#fc8181";
      for (let i = 0; i < 40; i++) {
        const x = 160 + Math.sin(i * 0.7) * (20 + i);
        const y = 150 + Math.cos(i * 0.9) * (10 + i * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, 3 + (i % 4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f7fafc";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("SAMPLE FAILED PRINT", 78, 28);
      return canvas.toDataURL("image/jpeg", 0.85);
    }
  }
  // 1x1 pixel fallback
  return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGf/9k=";
}
