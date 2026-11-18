"use client";

import {
  Clock3,
  ExternalLink,
  PackageSearch,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCeidStore } from "@/hooks/useCeidStore";
import {
  MATERIAL_CATEGORIES,
  SAMPLE_MATERIALS,
  filterMaterials,
  stockLevel,
} from "@/lib/materials";
import { TOUCHNET_STORE_URL } from "@/lib/touchnet";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { MaterialCategory, MaterialItem } from "@/types/ceid";

function StockBadge({ item }: { item: MaterialItem }) {
  const level = stockLevel(item);
  if (level === "out") {
    return <StatusPill status="offline" label="Out of Stock" />;
  }
  if (level === "low") {
    return (
      <StatusPill
        status="issue"
        label={`Low Stock: ${item.quantity} ${item.unit}`}
      />
    );
  }
  return (
    <StatusPill
      status="free"
      label={`In Stock: ${item.quantity} ${item.unit}`}
    />
  );
}

function BuyButton({ item }: { item: MaterialItem }) {
  const href = item.touchnetUrl || TOUCHNET_STORE_URL;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[12px] border border-[#286DC0] bg-white px-3 text-xs font-semibold text-[#286DC0] hover:bg-[#F3F8FD]"
    >
      View / Buy on TouchNet
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

export function MaterialsStock() {
  const { materialsQuery, setMaterialsQuery } = useCeidStore();
  const [category, setCategory] = useState<MaterialCategory | "all">("all");
  const [items, setItems] = useState<MaterialItem[]>(SAMPLE_MATERIALS);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncSource, setSyncSource] = useState<
    "touchnet" | "cache" | "fallback" | "loading"
  >("loading");
  const [warning, setWarning] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const load = useCallback(async (refresh = false) => {
    setSyncing(true);
    try {
      const res = await fetch(
        `/api/materials/touchnet${refresh ? "?refresh=1" : ""}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      setItems(json.items || []);
      setSyncedAt(json.fetchedAt || new Date().toISOString());
      setSyncSource(json.source || "fallback");
      setWarning(json.warning || null);
    } catch (e) {
      setWarning(e instanceof Error ? e.message : "TouchNet sync failed");
      setSyncSource("fallback");
      setItems(
        SAMPLE_MATERIALS.map((m) => ({
          ...m,
          touchnetUrl: TOUCHNET_STORE_URL,
          source: "fallback" as const,
        }))
      );
      setSyncedAt(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const rows = useMemo(
    () => filterMaterials(items, materialsQuery, category),
    [items, materialsQuery, category]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="ceid-display text-3xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-4xl">
            Materials & Stock
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#475569] md:text-base">
            Live CEID workshop inventory synced from TouchNet uStore #239, with
            floor-stock overlays for fasteners, filament, and consumables.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={syncing}
          className="inline-flex min-h-11 items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#00356B] disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          Refresh TouchNet
        </button>
      </div>

      <section className="ceid-card space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex min-h-11 flex-wrap items-center gap-2 rounded-full border border-[#E8F1FB] bg-[#E8F1FB] px-3 text-xs font-semibold text-[#00356B]">
            <Clock3 className="h-3.5 w-3.5" />
            Synced from TouchNet Store #239
            <span className="font-normal text-[#6B7280]">
              · Updated{" "}
              {syncedAt ? formatRelativeTime(syncedAt, tick) : "—"}
              {syncSource !== "touchnet" && syncSource !== "loading"
                ? ` · ${syncSource}`
                : ""}
            </span>
          </div>
          <a
            href={TOUCHNET_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#286DC0]"
          >
            Open TouchNet store
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        {warning && (
          <p className="rounded-[12px] border border-[#FEF7E0] bg-[#FEF7E0] px-3 py-2 text-sm text-[#B06000]">
            {warning}
          </p>
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={materialsQuery}
              onChange={(e) => setMaterialsQuery(e.target.value)}
              placeholder="Search name, thickness, fastener size, SKU…"
              className="min-h-12 w-full rounded-[12px] border border-[#E5E7EB] bg-white py-2 pl-10 pr-3 text-sm"
            />
          </label>
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

      {syncing && items.length === 0 ? (
        <div className="ceid-card space-y-3 p-5">
          <div className="ceid-skeleton h-24 w-full" />
          <div className="ceid-skeleton h-24 w-full" />
        </div>
      ) : rows.length === 0 ? (
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
              <article key={item.id} className="ceid-card space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#00356B]">{item.name}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{item.spec}</p>
                    {item.priceLabel && (
                      <p className="mt-1 text-sm font-semibold text-[#00356B]">
                        {item.priceLabel}
                      </p>
                    )}
                  </div>
                  <StockBadge item={item} />
                </div>
                <p className="text-sm text-[#286DC0]">{item.location}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-[#9CA3AF]">
                    {item.category}
                    {item.sku ? ` · ${item.sku}` : ""}
                  </span>
                </div>
                <BuyButton item={item} />
              </article>
            ))}
          </div>

          <div className="ceid-card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm tabular-nums">
                <thead className="bg-[#F8F9FA] text-xs uppercase tracking-wide text-[#6B7280]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 font-semibold">Specification</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">TouchNet</th>
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
                          {item.sku ? ` · ${item.sku}` : ""}
                        </p>
                        {item.priceLabel && (
                          <p className="mt-1 text-xs font-semibold text-[#00356B]">
                            {item.priceLabel}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4B5563]">{item.spec}</td>
                      <td className="px-4 py-3 text-[#286DC0]">
                        {item.location}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge item={item} />
                      </td>
                      <td className="px-4 py-3">
                        <BuyButton item={item} />
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
