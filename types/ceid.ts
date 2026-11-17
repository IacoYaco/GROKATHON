export type ApiMode = "live" | "fallback";

export type CeidRole = "student" | "faculty";

export interface CeidAccount {
  id: number;
  cursorSub: string;
  netid: string;
  displayName: string;
  email: string;
  role: CeidRole;
  affiliations: string[];
  authSource: "yale_cas" | "demo";
  college: string;
  classYear: string;
  lastLoginAt: string;
}

export interface CeidPermissions {
  canDiagnose: boolean;
  canRunDfm: boolean;
  canParseNewsletter: boolean;
  canUpdateMachineStatus: boolean;
  canForceMachineOffline: boolean;
  canViewRsvpRoster: boolean;
  canPostAnnouncements: boolean;
  canOverrideCerts: boolean;
  canAccessFacultyConsole: boolean;
  canUseCadStudio: boolean;
  canUseToolSandbox: boolean;
}

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

export type AppView =
  | "home"
  | "floor"
  | "dfm"
  | "workshops"
  | "faculty"
  | "cad"
  | "sandbox"
  | "materials";

export type MaterialCategory =
  | "wood"
  | "fasteners"
  | "filament"
  | "acrylic"
  | "consumables";

export type StockLevel = "in_stock" | "low" | "out";

export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  spec: string;
  location: string;
  quantity: number;
  unit: string;
  lowThreshold: number;
}

export interface LabAnnouncement {
  id: string;
  title: string;
  body: string;
  postedAt: string;
  tag: "hours" | "safety" | "supply" | "general";
}

export interface CadHole {
  x: number;
  y: number;
  diameter: number;
  label: string;
}

export interface CadFeature {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  label: string;
}

export interface CadRecipe {
  partName: string;
  width: number;
  depth: number;
  height: number;
  cornerRadius: number;
  wallThickness: number | null;
  holes: CadHole[];
  features: CadFeature[];
  onshapeNotes: string[];
  printTips: string[];
  summary: string;
}

export interface SandboxControl {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  targetMin: number;
  targetMax: number;
  hint: string;
}

export interface SandboxStep {
  id: string;
  instruction: string;
  controlId: string;
}

export interface SandboxScenario {
  toolName: string;
  ceidLocation: string;
  previewKind: "laser" | "printer" | "calipers" | "solder";
  materialLabel: string;
  controls: SandboxControl[];
  steps: SandboxStep[];
  safetyRules: string[];
  coaching: string;
}
