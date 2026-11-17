"use client";

import { MachineGrid } from "@/components/floor/MachineGrid";
import { SnapToDiagnose } from "@/components/floor/SnapToDiagnose";

export function FloorPulse() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[#00356B] md:text-3xl">
          Floor Pulse
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6B7280] md:text-base">
          Snap a failed print or cut, let Grok Vision diagnose it, then keep the
          live machine grid honest for the next student.
        </p>
      </div>
      <SnapToDiagnose />
      <MachineGrid />
    </div>
  );
}
