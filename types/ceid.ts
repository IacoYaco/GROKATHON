export type ApiMode = "live" | "fallback";

export type MachineStatus = "free" | "in_use" | "issue" | "offline";

export type CertId =
  | "laser_cutter"
  | "3d_printing"
  | "woodshop"
  | "metal_shop";

export interface SafetyCert {
  id: CertId;
  label: string;
  unlocked: boolean;
}

export interface Machine {
  id: string;
  name: string;
  category: "3d_printer" | "laser" | "room";
  status: MachineStatus;
  material: string;
  reportedAt: string; // ISO timestamp
  verifiedViaGrok?: boolean;
  note?: string;
}

export interface DiagnosisResult {
  machineId?: string;
  hardware: string;
  failureMode: string;
  rootCause: string;
  fixChecklist: string[];
  suggestedStatus: MachineStatus;
}

export interface DfmStep {
  order: number;
  station: string;
  action: string;
  material?: string;
  requiredCert?: CertId;
}

export interface DfmTrap {
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

export interface MaterialLocator {
  material: string;
  location: string;
  notes?: string;
}

export interface DfmPlan {
  summary: string;
  sequence: DfmStep[];
  traps: DfmTrap[];
  materials: MaterialLocator[];
  requiredCerts: CertId[];
}

export interface Workshop {
  id: string;
  title: string;
  grantsCert: CertId | null;
  grantsLabel: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  location: string;
  seatsAvailable: number;
  seatsTotal: number;
  prerequisites: string[];
}

export interface Rsvp {
  workshopId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  claimedAt: string;
}

export interface ApiEnvelope<T> {
  mode: ApiMode;
  data: T;
  error?: string;
}

export type AppView = "floor" | "dfm" | "workshops";
