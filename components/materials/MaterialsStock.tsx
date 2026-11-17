"use client";

import { Clock3, PackageSearch, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCeidStore } from "@/hooks/useCeidStore";
import {
  INVENTORY_LAST_REPORT_AT,
  MATERIAL_CATEGORIES,
  SAMPLE_MATERIALS,
  filterMaterials,
  stockLevel,
} from "@/lib/materials";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { MaterialCategory, MaterialItem } from "@/types/ceid";

function StockBadge({ item }: { item: MaterialItem }) {
  const level = stockLevel(item);
  if (level === "out") {
    return <StatusPill status="offline" label="Out of Stock" />;
  }
  if (level === "low") {
    return <StatusPill status="issue" label={`Low Stock · ${item.quantity}`} />;
  }
  return (
    <StatusPill status="free" label={`In Stock · ${item.quantity} ${item.unit}`} />
  );
}

export function MaterialsStock() {
  const { materialsQuery, setMaterialsQuery } = useCeidStore();
  const [category, setCategory] = useState<MaterialCategory | "all">("all");
  const [syncedAt, setSyncedAt] = useState(INVENTORY_LAST_REPORT_AT);
  const [syncing, setSyncing] = useState(false);

  const rows = useMemo(
    () => filterMaterials(SAMPLE_MATERIALS, materialsQuery, category),
    [materialsQuery, category]
  );

  const refreshReport = () => {
    setSyncing(true);
    window.setTimeout(() => {
      setSyncedAt(new Date().toISOString());
      setSyncing(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-light italic tracking-[-0.02em] text-[#00356B] md:text-4xl">
            Materials & Stock
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6B7280] md:text-base">
            Check CEID workshop supplies in real time — wood, fasteners,
            filament, acrylic, and consumables with bin locations.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshReport}
          className="inline-flex min-h-11 items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#00356B]"
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          Sync report
        </button>
      </div>

      <section className="ceid-card space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={materialsQuery}
              onChange={(e) => setMaterialsQuery(e.target.value)}
              placeholder="Search name, thickness, fastener size, bin…"
              className="min-h-12 w-full rounded-[12px] border border-[#E5E7EB] bg-white py-2 pl-10 pr-3 text-sm"
            />
          </label>
          <p className="flex items-center gap-1.5 text-xs text-[#6B7280] lg:shrink-0">
            <Clock3 className="h-3.5 w-3.5" />
            Last updated from report · {formatRelativeTime(syncedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MATERIAL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "min-h-11 rounded-full px-3 text-sm font-semibold",
                category === c.id
                  ? "bg-[#286DC0] text-white"
                  : "border border-[#E5E7EB] bg-white text-[#00356B]"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="ceid-card flex flex-col items-center gap-2 p-10 text-center">
          <PackageSearch className="h-8 w-8 text-[#9CA3AF]" />
          <p className="font-semibold text-[#00356B]">No materials matched</p>
          <p className="text-sm text-[#6B7280]">
            Try another search or clear the category filter.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((item) => (
              <article key={item.id} className="ceid-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#00356B]">{item.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{item.spec}</p>
                  </div>
                  <StockBadge item={item} />
                </div>
                <p className="mt-3 text-sm text-[#286DC0]">{item.location}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#9CA3AF]">
                  {item.category}
                </p>
              </article>
            ))}
          </div>

          <div className="ceid-card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 font-semibold">Specification</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-[#E5E7EB] align-top"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#00356B]">
                          {item.name}
                        </p>
                        <p className="text-xs uppercase tracking-wide text-[#9CA3AF]">
                          {item.category}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">{item.spec}</td>
                      <td className="px-4 py-3 text-[#286DC0]">
                        {item.location}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge item={item} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
