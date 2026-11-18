import { cn } from "@/lib/utils";
import type { MachineStatus } from "@/types/ceid";

const STATUS_STYLES: Record<
  MachineStatus | "certified" | "locked" | "priority",
  string
> = {
  free: "bg-[#E6F4EA] text-[#137333] ring-1 ring-[#137333]/15",
  certified: "bg-[#E6F4EA] text-[#137333] ring-1 ring-[#137333]/15",
  in_use: "bg-[#FEF7E0] text-[#B06000] ring-1 ring-[#B06000]/15",
  issue: "bg-[#FEF7E0] text-[#B06000] ring-1 ring-[#B06000]/15",
  offline: "bg-[#FCE8E6] text-[#C5221F] ring-1 ring-[#C5221F]/15",
  locked: "bg-[#FCE8E6] text-[#C5221F] ring-1 ring-[#C5221F]/15",
  priority: "bg-[#FEF7E0] text-[#B06000] ring-1 ring-[#B06000]/15",
};

const LIVE: Record<string, boolean> = {
  free: true,
  certified: true,
  in_use: true,
  issue: true,
};

const STATUS_LABELS: Record<MachineStatus, string> = {
  free: "Available",
  in_use: "In Use",
  issue: "Needs Attention",
  offline: "Offline",
};

export function StatusPill({
  status,
  label,
  className,
  live,
}: {
  status: MachineStatus | "certified" | "locked" | "priority";
  label?: string;
  className?: string;
  live?: boolean;
}) {
  const text =
    label ||
    (status in STATUS_LABELS
      ? STATUS_LABELS[status as MachineStatus]
      : status);
  const showDot = live ?? LIVE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-[-0.01em]",
        STATUS_STYLES[status],
        className
      )}
    >
      {showDot && <span className="ceid-live-dot" aria-hidden />}
      <span className="ceid-mono text-[11px]">{text}</span>
    </span>
  );
}
