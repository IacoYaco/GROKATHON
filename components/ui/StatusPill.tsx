import { cn } from "@/lib/utils";
import type { MachineStatus } from "@/types/ceid";

const STATUS_STYLES: Record<
  MachineStatus | "certified" | "locked" | "priority",
  string
> = {
  free: "bg-[#E6F4EA] text-[#137333]",
  certified: "bg-[#E6F4EA] text-[#137333]",
  in_use: "bg-[#FEF7E0] text-[#B06000]",
  issue: "bg-[#FEF7E0] text-[#B06000]",
  offline: "bg-[#FCE8E6] text-[#C5221F]",
  locked: "bg-[#FCE8E6] text-[#C5221F]",
  priority: "bg-[#FEF7E0] text-[#B06000]",
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
}: {
  status: MachineStatus | "certified" | "locked" | "priority";
  label?: string;
  className?: string;
}) {
  const text =
    label ||
    (status in STATUS_LABELS
      ? STATUS_LABELS[status as MachineStatus]
      : status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
        className
      )}
    >
      {text}
    </span>
  );
}
