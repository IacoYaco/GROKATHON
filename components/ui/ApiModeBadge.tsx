"use client";

import { Cpu, Sparkles } from "lucide-react";
import { useCeidStore } from "@/hooks/useCeidStore";
import { cn } from "@/lib/utils";

export function ApiModeBadge({ className }: { className?: string }) {
  const { apiMode } = useCeidStore();

  if (!apiMode) {
    return (
      <span
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#4B5563]",
          className
        )}
      >
        <Cpu className="h-3.5 w-3.5" />
        Awaiting Grok call
      </span>
    );
  }

  const live = apiMode === "live";
  return (
    <span
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
        live
          ? "bg-[#E8F1FB] text-[#00356B]"
          : "bg-[#FEF7E0] text-[#B06000]",
        className
      )}
      title={
        live
          ? "Responses from live xAI Grok API"
          : "XAI_API_KEY missing or call failed — using fallback mocks"
      }
    >
      {live ? (
        <Sparkles className="h-3.5 w-3.5" />
      ) : (
        <Cpu className="h-3.5 w-3.5" />
      )}
      {live ? "Live Grok API" : "Fallback mode"}
    </span>
  );
}
