"use client";

import { Clock3, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAuth } from "@/hooks/useAuth";
import { useCeidStore } from "@/hooks/useCeidStore";
import { confidenceLabel, formatRelativeTime } from "@/lib/utils";
import type { Machine, MachineStatus } from "@/types/ceid";

function MachineCard({ machine }: { machine: Machine }) {
  const { permissions } = useAuth();
  const { updateMachineStatus } = useCeidStore();
  const quick: { status: MachineStatus; label: string }[] = [
    { status: "free", label: "Free" },
    { status: "in_use", label: "In Use" },
    { status: "issue", label: "Issue" },
    ...(permissions.canForceMachineOffline
      ? [{ status: "offline" as const, label: "Offline (Faculty)" }]
      : []),
  ];
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const conf = confidenceLabel(machine.reportedAt, now);
  const relative = formatRelativeTime(machine.reportedAt, now);

  return (
    <article className="ceid-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[#00356B]">{machine.name}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">{machine.material}</p>
        </div>
        <StatusPill status={machine.status} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6B7280]">
        <Clock3 className="h-3.5 w-3.5" />
        <span>
          Reported {relative} • {conf.label}
        </span>
      </div>

      {machine.verifiedViaGrok && (
        <span className="mt-2 inline-flex w-fit rounded-full bg-[#E8F1FB] px-2.5 py-1 text-xs font-semibold text-[#286DC0]">
          Verified via Grok Vision
        </span>
      )}

      {machine.note && (
        <p className="mt-2 line-clamp-2 text-xs text-[#4B5563]">{machine.note}</p>
      )}

      <div className="relative mt-auto pt-4" ref={popRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white text-sm font-semibold text-[#00356B] hover:bg-[#F8F9FA]"
        >
          <MoreHorizontal className="h-4 w-4" />
          Update Status
        </button>
        {open && (
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-[16px] border border-[#E7E7E7] bg-white/95 shadow-lg backdrop-blur">
            {quick.map((q) => (
              <button
                key={q.status}
                type="button"
                className="flex min-h-11 w-full items-center px-3 text-left text-sm font-medium text-[#374151] hover:bg-[#F3F6F9]"
                onClick={() => {
                  updateMachineStatus(machine.id, q.status, {
                    verifiedViaGrok: false,
                    note:
                      q.status === "offline"
                        ? "Marked offline by faculty"
                        : undefined,
                  });
                  setOpen(false);
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function MachineGrid() {
  const { machines } = useCeidStore();

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#00356B]">
            Crowdsourced Floor Pulse
          </h2>
          <p className="text-sm text-[#6B7280]">
            Confidence decays with age — tap Update Status to keep the floor honest.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {machines.map((m) => (
          <MachineCard key={m.id} machine={m} />
        ))}
      </div>
    </section>
  );
}
