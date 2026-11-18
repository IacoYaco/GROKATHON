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
          "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-3 text-xs font-medium text-[#475569]",
          className
        )}
      >
        <span className="ceid-live-dot text-[#94A3B8]" />
        <Cpu className="h-3.5 w-3.5" />
        Awaiting Grok
      </span>
    );
  }

  const live = apiMode === "live";
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
        live
          ? "bg-[#E8F1FB] text-[#00356B] ring-1 ring-[#286DC0]/20"
          : "bg-[#FEF7E0] text-[#B06000] ring-1 ring-[#B06000]/15",
        className
      )}
      title={
        live
          ? "Responses from live xAI Grok API"
          : "XAI_API_KEY missing or call failed — using fallback mocks"
      }
    >
      {live ? (
        <>
          <span className="ceid-live-dot" />
          <Sparkles className="h-3.5 w-3.5" />
        </>
      ) : (
        <Cpu className="h-3.5 w-3.5" />
      )}
      <span className="ceid-mono text-[11px]">
        {live ? "Live Grok API" : "Fallback mode"}
      </span>
    </span>
  );
}
