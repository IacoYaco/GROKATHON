"use client";

import { FloorAnnouncements } from "@/components/floor/FloorAnnouncements";
import { MachineGrid } from "@/components/floor/MachineGrid";
import { SnapToDiagnose } from "@/components/floor/SnapToDiagnose";

export function FloorPulse() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-light italic tracking-[-0.02em] text-[#212121] md:text-4xl">
          Floor Pulse
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#424242] md:text-base">
          Snap a failed print or cut, let Grok Vision diagnose it, then keep the
          live machine grid honest for the next student.
        </p>
      </div>
      <FloorAnnouncements />
      <SnapToDiagnose />
      <MachineGrid />
    </div>
  );
}
