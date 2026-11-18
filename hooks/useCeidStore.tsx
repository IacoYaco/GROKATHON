"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CERTS, DEFAULT_MACHINES } from "@/lib/sample-data";
import type {
  ApiMode,
  AppView,
  CertId,
  Machine,
  MachineStatus,
  Rsvp,
  SafetyCert,
  Workshop,
} from "@/types/ceid";

const KEYS = {
  machines: "ceid.machines",
  certs: "ceid.certs",
  rsvps: "ceid.rsvps",
  dfmRequiredCerts: "ceid.dfmRequiredCerts",
  certFilter: "ceid.certFilter",
  materialsQuery: "ceid.materialsQuery",
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type IntentTarget = AppView;

interface CeidStoreValue {
  hydrated: boolean;
  machines: Machine[];
  certs: SafetyCert[];
  rsvps: Rsvp[];
  dfmRequiredCerts: CertId[];
  certFilter: CertId | null;
  materialsQuery: string;
  pendingIntent: string | null;
  view: AppView;
  apiMode: ApiMode | null;
  setView: (view: AppView) => void;
  setApiMode: (mode: ApiMode) => void;
  setCertFilter: (cert: CertId | null) => void;
  setMaterialsQuery: (query: string) => void;
  openMaterials: (query?: string) => void;
  setPendingIntent: (intent: string | null) => void;
  consumePendingIntent: () => string | null;
  routeIntent: (text: string) => IntentTarget;
  toggleCert: (id: CertId) => void;
  updateMachineStatus: (
    id: string,
    status: MachineStatus,
    extras?: Partial<Pick<Machine, "verifiedViaGrok" | "note" | "material">>
  ) => void;
  setDfmRequiredCerts: (certs: CertId[]) => void;
  claimRsvp: (workshop: Workshop) => Rsvp;
  isRsvped: (workshopId: string) => boolean;
  jumpToCertSniper: (cert: CertId) => void;
}

function inferIntentTarget(text: string): IntentTarget {
  const t = text.toLowerCase();
  if (
    /(string|warp|fail|failing|diagnos|prusa|bambu|print\s*fail|z-?offset|layer)/.test(
      t
    )
  ) {
    return "floor";
  }
  if (/(stl|cad|hole|bracket|enclosure|mount|parametric)/.test(t)) {
    return "cad";
  }
  if (/(laser|acrylic|sandbox|power\s*%|epilog|solder|caliper)/.test(t)) {
    return "sandbox";
  }
  if (/(stock|material|plywood|mdf|filament|touchnet|fastener)/.test(t)) {
    return "materials";
  }
  if (/(workshop|cert|rsvp|newsletter)/.test(t)) {
    return "workshops";
  }
  if (/(dfm|fabricat|route|build|cut\s+\d|station)/.test(t)) {
    return "dfm";
  }
  return "dfm";
}

const CeidStoreContext = createContext<CeidStoreValue | null>(null);

export function CeidStoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [machines, setMachines] = useState<Machine[]>(DEFAULT_MACHINES);
  const [certs, setCerts] = useState<SafetyCert[]>(DEFAULT_CERTS);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [dfmRequiredCerts, setDfmRequiredCertsState] = useState<CertId[]>([]);
  const [certFilter, setCertFilterState] = useState<CertId | null>(null);
  const [materialsQuery, setMaterialsQueryState] = useState("");
  const [pendingIntent, setPendingIntentState] = useState<string | null>(null);
  const [view, setView] = useState<AppView>("home");
  const [apiMode, setApiMode] = useState<ApiMode | null>(null);

  useEffect(() => {
    setMachines(readJson(KEYS.machines, DEFAULT_MACHINES));
    setCerts(readJson(KEYS.certs, DEFAULT_CERTS));
    setRsvps(readJson(KEYS.rsvps, []));
    setDfmRequiredCertsState(readJson(KEYS.dfmRequiredCerts, []));
    setCertFilterState(readJson(KEYS.certFilter, null));
    setMaterialsQueryState(readJson(KEYS.materialsQuery, ""));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.machines, machines);
  }, [machines, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.certs, certs);
  }, [certs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.rsvps, rsvps);
  }, [rsvps, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.dfmRequiredCerts, dfmRequiredCerts);
  }, [dfmRequiredCerts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.certFilter, certFilter);
  }, [certFilter, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(KEYS.materialsQuery, materialsQuery);
  }, [materialsQuery, hydrated]);

  const toggleCert = useCallback((id: CertId) => {
    setCerts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unlocked: !c.unlocked } : c))
    );
  }, []);

  const updateMachineStatus = useCallback(
    (
      id: string,
      status: MachineStatus,
      extras?: Partial<Pick<Machine, "verifiedViaGrok" | "note" | "material">>
    ) => {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status,
                reportedAt: new Date().toISOString(),
                verifiedViaGrok: extras?.verifiedViaGrok ?? false,
                note: extras?.note ?? m.note,
                material: extras?.material ?? m.material,
              }
            : m
        )
      );
    },
    []
  );

  const setDfmRequiredCerts = useCallback((next: CertId[]) => {
    setDfmRequiredCertsState(next);
  }, []);

  const setCertFilter = useCallback((cert: CertId | null) => {
    setCertFilterState(cert);
  }, []);

  const setMaterialsQuery = useCallback((query: string) => {
    setMaterialsQueryState(query);
  }, []);

  const openMaterials = useCallback((query?: string) => {
    if (typeof query === "string") setMaterialsQueryState(query);
    setView("materials");
  }, []);

  const setPendingIntent = useCallback((intent: string | null) => {
    setPendingIntentState(intent);
  }, []);

  const consumePendingIntent = useCallback(() => {
    const taken = pendingIntent;
    if (taken) setPendingIntentState(null);
    return taken;
  }, [pendingIntent]);

  const routeIntent = useCallback((text: string) => {
    const trimmed = text.trim();
    const target = inferIntentTarget(trimmed);
    setPendingIntentState(trimmed || null);
    if (target === "materials") {
      setMaterialsQueryState(trimmed);
    }
    setView(target);
    return target;
  }, []);

  const claimRsvp = useCallback((workshop: Workshop): Rsvp => {
    const rsvp: Rsvp = {
      workshopId: workshop.id,
      title: workshop.title,
      startsAt: workshop.startsAt,
      endsAt: workshop.endsAt,
      location: workshop.location,
      claimedAt: new Date().toISOString(),
    };
    setRsvps((prev) => {
      if (prev.some((r) => r.workshopId === workshop.id)) return prev;
      return [...prev, rsvp];
    });
    return rsvp;
  }, []);

  const isRsvped = useCallback(
    (workshopId: string) => rsvps.some((r) => r.workshopId === workshopId),
    [rsvps]
  );

  const jumpToCertSniper = useCallback((cert: CertId) => {
    setCertFilterState(cert);
    setView("workshops");
  }, []);

  const value = useMemo<CeidStoreValue>(
    () => ({
      hydrated,
      machines,
      certs,
      rsvps,
      dfmRequiredCerts,
      certFilter,
      materialsQuery,
      pendingIntent,
      view,
      apiMode,
      setView,
      setApiMode,
      setCertFilter,
      setMaterialsQuery,
      openMaterials,
      setPendingIntent,
      consumePendingIntent,
      routeIntent,
      toggleCert,
      updateMachineStatus,
      setDfmRequiredCerts,
      claimRsvp,
      isRsvped,
      jumpToCertSniper,
    }),
    [
      hydrated,
      machines,
      certs,
      rsvps,
      dfmRequiredCerts,
      certFilter,
      materialsQuery,
      pendingIntent,
      view,
      apiMode,
      setCertFilter,
      setMaterialsQuery,
      openMaterials,
      setPendingIntent,
      consumePendingIntent,
      routeIntent,
      toggleCert,
      updateMachineStatus,
      setDfmRequiredCerts,
      claimRsvp,
      isRsvped,
      jumpToCertSniper,
    ]
  );

  return (
    <CeidStoreContext.Provider value={value}>
      {children}
    </CeidStoreContext.Provider>
  );
}

export function useCeidStore() {
  const ctx = useContext(CeidStoreContext);
  if (!ctx) throw new Error("useCeidStore must be used within CeidStoreProvider");
  return ctx;
}
