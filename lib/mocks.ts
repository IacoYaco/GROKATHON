import type {
  CadRecipe,
  DiagnosisResult,
  DfmPlan,
  SandboxScenario,
  Workshop,
} from "@/types/ceid";

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

export function mockCadRecipe(prompt?: string): CadRecipe {
  const wantsThick = /5\s*mm|thicker|thickness/i.test(prompt || "");
  const wantsWide = /80|widen|wider/i.test(prompt || "");
  const width = wantsWide ? 80 : 60;
  const height = wantsThick ? 5 : 4;
  return {
    partName: "Modified Motor Mount Plate",
    width,
    depth: 60,
    height,
    cornerRadius: 3,
    wallThickness: null,
    holes: [
      { x: -width / 2 + 8, y: -22, diameter: 4.3, label: "M4 corner (+0.3 clearance)" },
      { x: width / 2 - 8, y: -22, diameter: 4.3, label: "M4 corner (+0.3 clearance)" },
      { x: -width / 2 + 8, y: 22, diameter: 4.3, label: "M4 corner (+0.3 clearance)" },
      { x: width / 2 - 8, y: 22, diameter: 4.3, label: "M4 corner (+0.3 clearance)" },
      { x: 0, y: 0, diameter: 22, label: "Wire pass-through" },
    ],
    features: [],
    onshapeNotes: [
      "Start from a Sketch on the Top plane; extrude the plate to the new height.",
      "Use Hole tool or Extrude-Cut for M4 and center holes from the same sketch.",
      "Dimension corner holes from edges (8mm inset) so the pattern stays parametric.",
      "Export as STL with fine resolution before slicing on CEID Prusa/Bambu.",
    ],
    printTips: [
      "Added +0.3mm clearance to M4 holes for FDM print shrinkage.",
      "Print flat on bed; 0.2mm layers, 3 perimeters, 30% infill is enough for mounts.",
      "If PETG, dry filament and use a brim for the first CEID print.",
    ],
    summary:
      "Parametric plate updated from the reference bounding box with thicker stock, optional width increase, M4 corner pattern, and a 22mm center wire hole.",
  };
}

export function mockSandboxScenario(prompt?: string): SandboxScenario {
  const p = (prompt || "").toLowerCase();
  if (p.includes("caliper") || p.includes("press-fit")) {
    return {
      toolName: "Mitutoyo Digital Calipers",
      ceidLocation: "Metrology drawer — Becton shop desk",
      previewKind: "calipers",
      materialLabel: "PLA shaft + PETG bushing",
      controls: [
        {
          id: "reading",
          label: "Displayed reading",
          unit: "mm",
          min: 9.5,
          max: 10.5,
          step: 0.01,
          defaultValue: 10.12,
          targetMin: 9.98,
          targetMax: 10.02,
          hint: "Zero on clean jaws; rock the part for a consistent reading.",
        },
        {
          id: "clearance",
          label: "Designed clearance",
          unit: "mm",
          min: 0,
          max: 0.4,
          step: 0.01,
          defaultValue: 0.05,
          targetMin: 0.15,
          targetMax: 0.25,
          hint: "FDM press-fits usually need 0.15–0.25mm radial clearance.",
        },
        {
          id: "force",
          label: "Assembly force feel",
          unit: "%",
          min: 0,
          max: 100,
          step: 5,
          defaultValue: 80,
          targetMin: 30,
          targetMax: 55,
          hint: "Should seat firmly by hand — not hammer territory.",
        },
      ],
      steps: [
        {
          id: "s1",
          instruction: "Zero calipers and measure the shaft into the green band.",
          controlId: "reading",
        },
        {
          id: "s2",
          instruction: "Set designed clearance for FDM shrinkage.",
          controlId: "clearance",
        },
        {
          id: "s3",
          instruction: "Confirm assembly force is firm but hand-friendly.",
          controlId: "force",
        },
      ],
      safetyRules: [
        "Do not drop calipers — jaw damage ruins accuracy.",
        "Wipe grit off parts before measuring to protect jaws.",
      ],
      coaching:
        "Press-fits fail when CAD assumes laser precision; measure twice, then open the hole or shrink the pin.",
    };
  }
  if (p.includes("solder") || p.includes("esp32")) {
    return {
      toolName: "Weller WE1010 Soldering Station",
      ceidLocation: "Electronics bench — Becton 110",
      previewKind: "solder",
      materialLabel: "ESP32 header pins",
      controls: [
        {
          id: "temp",
          label: "Tip temperature",
          unit: "°C",
          min: 250,
          max: 450,
          step: 5,
          defaultValue: 420,
          targetMin: 330,
          targetMax: 360,
          hint: "Lead-free joints usually land near 340–350°C with fresh tip tin.",
        },
        {
          id: "dwell",
          label: "Contact time",
          unit: "s",
          min: 0.5,
          max: 6,
          step: 0.5,
          defaultValue: 4,
          targetMin: 1.5,
          targetMax: 3,
          hint: "Heat pad+pin together briefly, then feed solder.",
        },
        {
          id: "flux",
          label: "Flux assist",
          unit: "%",
          min: 0,
          max: 100,
          step: 10,
          defaultValue: 20,
          targetMin: 50,
          targetMax: 100,
          hint: "More flux reduces bridging on dense headers.",
        },
      ],
      steps: [
        {
          id: "s1",
          instruction: "Set tip temperature into the safe lead-free window.",
          controlId: "temp",
        },
        {
          id: "s2",
          instruction: "Practice a short dwell so pads do not lift.",
          controlId: "dwell",
        },
        {
          id: "s3",
          instruction: "Use enough flux to prevent bridges.",
          controlId: "flux",
        },
      ],
      safetyRules: [
        "Use fume extraction; never breathe flux smoke.",
        "Return iron to stand — never set it on the bench.",
        "Wash hands after soldering.",
      ],
      coaching:
        "Bridges come from too much solder or cold joints — tin the tip, heat both metals, then feed.",
    };
  }
  if (p.includes("prusa") || p.includes("petg") || p.includes("print")) {
    return {
      toolName: "Prusa MK4",
      ceidLocation: "Prusa cluster — Becton shop floor",
      previewKind: "printer",
      materialLabel: "PETG bracket",
      controls: [
        {
          id: "nozzle",
          label: "Nozzle temperature",
          unit: "°C",
          min: 200,
          max: 280,
          step: 1,
          defaultValue: 265,
          targetMin: 230,
          targetMax: 250,
          hint: "PETG on CEID MK4s usually prints clean near 240°C.",
        },
        {
          id: "bed",
          label: "Bed temperature",
          unit: "°C",
          min: 40,
          max: 110,
          step: 1,
          defaultValue: 95,
          targetMin: 80,
          targetMax: 90,
          hint: "Too hot and PETG can glue permanently to the sheet.",
        },
        {
          id: "speed",
          label: "First-layer speed",
          unit: "mm/s",
          min: 10,
          max: 60,
          step: 1,
          defaultValue: 45,
          targetMin: 18,
          targetMax: 28,
          hint: "Slow the first layer for adhesion without elephant foot.",
        },
        {
          id: "fan",
          label: "Part cooling fan",
          unit: "%",
          min: 0,
          max: 100,
          step: 5,
          defaultValue: 80,
          targetMin: 20,
          targetMax: 40,
          hint: "PETG likes limited cooling after layer 1.",
        },
      ],
      steps: [
        {
          id: "s1",
          instruction: "Dial nozzle into the PETG green zone.",
          controlId: "nozzle",
        },
        {
          id: "s2",
          instruction: "Set bed so the part sticks without welding to the sheet.",
          controlId: "bed",
        },
        {
          id: "s3",
          instruction: "Slow the first layer for reliable adhesion.",
          controlId: "speed",
        },
        {
          id: "s4",
          instruction: "Limit part cooling for PETG layers above 1.",
          controlId: "fan",
        },
      ],
      safetyRules: [
        "Keep hands clear of the moving gantry.",
        "Do not leave flammable scrap on the heated bed.",
        "If nozzle scrapes the sheet, stop and re-run first-layer cal.",
      ],
      coaching:
        "PETG strings when wet or too hot — dry the spool and stay inside the green bands.",
    };
  }
  return {
    toolName: "Epilog Fusion Pro Laser",
    ceidLocation: "Epilog bay — Becton 104",
    previewKind: "laser",
    materialLabel: "3mm clear acrylic",
    controls: [
      {
        id: "power",
        label: "Laser power",
        unit: "%",
        min: 10,
        max: 100,
        step: 1,
        defaultValue: 95,
        targetMin: 55,
        targetMax: 70,
        hint: "Clear acrylic wants moderate power with enough speed to avoid melt puddles.",
      },
      {
        id: "speed",
        label: "Cut speed",
        unit: "%",
        min: 5,
        max: 100,
        step: 1,
        defaultValue: 15,
        targetMin: 35,
        targetMax: 50,
        hint: "Slow + hot scorches; raise speed once power is in band.",
      },
      {
        id: "freq",
        label: "Pulse frequency",
        unit: "Hz",
        min: 500,
        max: 5000,
        step: 100,
        defaultValue: 4500,
        targetMin: 1500,
        targetMax: 2500,
        hint: "Lower Hz reduces heat soak on acrylic edges.",
      },
      {
        id: "focus",
        label: "Focus offset",
        unit: "mm",
        min: -2,
        max: 2,
        step: 0.1,
        defaultValue: 1.2,
        targetMin: -0.2,
        targetMax: 0.2,
        hint: "Focus on the top surface of 3mm acrylic for a clean kerf.",
      },
    ],
    steps: [
      {
        id: "s1",
        instruction: "Bring power into the acrylic cut window (not max).",
        controlId: "power",
      },
      {
        id: "s2",
        instruction: "Raise speed so the edge does not melt.",
        controlId: "speed",
      },
      {
        id: "s3",
        instruction: "Drop frequency to limit heat soak.",
        controlId: "freq",
      },
      {
        id: "s4",
        instruction: "Focus on the top of the sheet.",
        controlId: "focus",
      },
    ],
    safetyRules: [
      "Never cut PVC/vinyl — releases toxic chlorine gas.",
      "Stay with the machine while the laser is firing.",
      "Confirm exhaust is running before the first cut.",
      "Keep a CO₂ extinguisher nearby; know the e-stop.",
    ],
    coaching:
      "Melted acrylic means too much energy density — drop power or increase speed until the swatch shows a clean edge.",
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
