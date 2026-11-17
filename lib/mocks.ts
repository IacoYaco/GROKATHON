import type { DiagnosisResult, DfmPlan, Workshop } from "@/types/ceid";

export function mockDiagnosis(machineId?: string): DiagnosisResult {
  return {
    machineId,
    hardware: machineId?.startsWith("bambu")
      ? "Bambu Lab X1C"
      : machineId?.startsWith("epilog")
        ? "Epilog Fusion Pro"
        : "Prusa MK4",
    failureMode: "Layer Shift / Bed Adhesion Failure",
    rootCause:
      "First-layer under-extrusion combined with a slightly cool bed caused the print to peel and catch the nozzle around layer 40, producing a progressive layer shift along the Y axis. Spaghetti on the right side matches a detached perimeter after adhesion loss.",
    fixChecklist: [
      "Re-level / run first-layer calibration; confirm Z-offset is ~0.1–0.15 mm for PLA.",
      "Raise bed temperature to 60–65°C (PLA) or 80–85°C (PETG) and clean bed with IPA.",
      "Slow first layer to 20–25 mm/s; bump first-layer extrusion multiplier +2–5%.",
      "Check belt tension on Y (and X); look for loose pulley set screws after a crash.",
      "Enable/verify crash detection; reduce acceleration if printing tall thin parts.",
      "Re-slice with brim (≥5 mm) for small footprints; dry filament if stringing persists.",
    ],
    suggestedStatus: "issue",
  };
}

export function mockDfmPlan(): DfmPlan {
  return {
    summary:
      "Laser-cut a 3mm Delrin chassis and birch plywood jigs, then print PETG motor mounts and FC standoffs on a Bambu X1C. Woodshop is only needed for optional foam padding and sanding — Metal Shop is not required for v1.",
    sequence: [
      {
        order: 1,
        station: "Epilog Laser Cutter #1",
        action:
          "Laser cut 3mm Delrin center plate + arm blanks with 0.15 mm kerf compensation",
        material: "3mm Delrin sheet",
        requiredCert: "laser_cutter",
      },
      {
        order: 2,
        station: "Bambu Lab X1C #1 or #2",
        action:
          "Print PETG motor mounts (16×19 mm pattern) and 30×30 mm FC standoffs, 0.2 mm layers, 40% gyroid",
        material: "PETG — Orange or Clear",
        requiredCert: "3d_printing",
      },
      {
        order: 3,
        station: "Epilog Laser Cutter",
        action:
          "Cut 3mm birch plywood assembly jig and battery tray; engrave motor polarity marks",
        material: "3mm Birch plywood",
        requiredCert: "laser_cutter",
      },
      {
        order: 4,
        station: "Woodshop — Sanding bench",
        action:
          "Break sharp plywood edges, cut EVA foam pads for landing gear (optional but recommended)",
        material: "EVA foam scrap",
        requiredCert: "woodshop",
      },
      {
        order: 5,
        station: "Becton Study Room / Electronics bench",
        action:
          "Dry-fit arms, torque M3 hardware, route ESCs, balance props before hover test",
      },
    ],
    traps: [
      {
        title: "Kerf on Delrin arm slots",
        detail:
          "Without +0.1–0.2 mm kerf compensation, press-fit carbon/PETG inserts will be too tight and crack Delrin live hinges.",
        severity: "critical",
      },
      {
        title: "PETG overhangs on motor mounts",
        detail:
          "Keep overhangs ≤45° or enable tree supports; unsupported 60° PETG lips warp and ovalize the 16×19 pattern.",
        severity: "warning",
      },
      {
        title: "Wall thickness at bolt bosses",
        detail:
          "Motor mount bosses need ≥2.4 mm walls around M3 holes or they crush under prop torque.",
        severity: "warning",
      },
      {
        title: "Plywood grain orientation",
        detail:
          "Align arm jigs with face grain along the long axis to reduce snap risk during tip-over tests.",
        severity: "info",
      },
    ],
    materials: [
      {
        material: "3mm Delrin (Acetal) sheet",
        location: "Engineering plastics cabinet — Drawer D3, South wall near Laser #1",
        notes: "Ask desk if opaque black is preferred over natural.",
      },
      {
        material: "3mm Birch plywood",
        location: "Sheet Rack B, North Wall (Becton shop)",
        notes: "Use offcuts under 12×12 first; full sheets need staff OK.",
      },
      {
        material: "PETG filament",
        location: "Filament dry-box rack beside Bambu X1C cluster",
        notes: "Orange is low on X1C #2 — prefer Clear or Black until Monday restock.",
      },
      {
        material: "M3 hardware + locknuts",
        location: "Fastener bins — Bay 2, labeled drawers under electronics bench",
      },
    ],
    requiredCerts: ["laser_cutter", "3d_printing", "woodshop"],
  };
}

export function mockWorkshops(): Workshop[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const at = (dayOffset: number, hour: number, minute = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: "ws-woodshop-wed",
      title: "Woodshop Safety Training",
      grantsCert: "woodshop",
      grantsLabel: "Woodshop",
      startsAt: at(2, 18, 0),
      endsAt: at(2, 20, 0),
      location: "Becton 102",
      seatsAvailable: 8,
      seatsTotal: 12,
      prerequisites: ["Closed-toe shoes", "Yale ID"],
    },
    {
      id: "ws-metal-thu",
      title: "Intro to Metal Shop & Mill Safety",
      grantsCert: "metal_shop",
      grantsLabel: "Metal Shop",
      startsAt: at(3, 17, 30),
      endsAt: at(3, 19, 30),
      location: "Becton 015",
      seatsAvailable: 6,
      seatsTotal: 10,
      prerequisites: ["Long pants", "Closed-toe shoes", "Woodshop recommended"],
    },
    {
      id: "ws-laser-adv",
      title: "Laser Cutter Advanced: Kerf & Acrylic Welding",
      grantsCert: null,
      grantsLabel: "None (advanced tips)",
      startsAt: at(4, 13, 0),
      endsAt: at(4, 14, 30),
      location: "Becton 110",
      seatsAvailable: 4,
      seatsTotal: 8,
      prerequisites: ["Laser Cutter certification"],
    },
    {
      id: "ws-3d-oh",
      title: "3D Printing Office Hours",
      grantsCert: null,
      grantsLabel: "None",
      startsAt: at(1, 16, 0),
      endsAt: at(1, 18, 0),
      location: "Prusa cluster — Becton shop floor",
      seatsAvailable: 12,
      seatsTotal: 12,
      prerequisites: [],
    },
  ];
}
