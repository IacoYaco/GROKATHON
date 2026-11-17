import type { LabAnnouncement, MaterialItem, StockLevel } from "@/types/ceid";

export const MATERIAL_CATEGORIES: {
  id: MaterialItem["category"] | "all";
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "wood", label: "Wood" },
  { id: "fasteners", label: "Fasteners" },
  { id: "filament", label: "Filament" },
  { id: "acrylic", label: "Acrylic" },
  { id: "consumables", label: "Consumables" },
];

export const SAMPLE_MATERIALS: MaterialItem[] = [
  {
    id: "ply-18",
    name: "Birch Plywood",
    category: "wood",
    spec: '1/8" (3mm) · 12×24" sheet',
    location: "Sheet Rack B, North Wall",
    quantity: 18,
    unit: "sheets",
    lowThreshold: 5,
  },
  {
    id: "ply-14",
    name: "Birch Plywood",
    category: "wood",
    spec: '1/4" (6mm) · 12×24" sheet',
    location: "Sheet Rack B, North Wall",
    quantity: 11,
    unit: "sheets",
    lowThreshold: 4,
  },
  {
    id: "ply-12",
    name: "Birch Plywood",
    category: "wood",
    spec: '1/2" · 12×24" sheet',
    location: "Sheet Rack A, North Wall",
    quantity: 3,
    unit: "sheets",
    lowThreshold: 4,
  },
  {
    id: "mdf-14",
    name: "MDF",
    category: "wood",
    spec: '1/4" · 24×24" sheet',
    location: "Sheet Rack C",
    quantity: 7,
    unit: "sheets",
    lowThreshold: 3,
  },
  {
    id: "oak-34",
    name: "Hardwood Oak Board",
    category: "wood",
    spec: '3/4" · 3×24" stock',
    location: "Lumber Bay 2",
    quantity: 0,
    unit: "boards",
    lowThreshold: 2,
  },
  {
    id: "m3-bolt",
    name: "Hex Bolt",
    category: "fasteners",
    spec: "M3 × 12mm",
    location: "Fastener Bin A-2",
    quantity: 240,
    unit: "pcs",
    lowThreshold: 50,
  },
  {
    id: "m3-nut",
    name: "Hex Nut",
    category: "fasteners",
    spec: "M3",
    location: "Fastener Bin A-3",
    quantity: 180,
    unit: "pcs",
    lowThreshold: 40,
  },
  {
    id: "m4-bolt",
    name: "Socket Cap Screw",
    category: "fasteners",
    spec: "M4 × 20mm",
    location: "Fastener Bin B-1",
    quantity: 42,
    unit: "pcs",
    lowThreshold: 50,
  },
  {
    id: "m4-washer",
    name: "Flat Washer",
    category: "fasteners",
    spec: "M4",
    location: "Fastener Bin B-4",
    quantity: 95,
    unit: "pcs",
    lowThreshold: 30,
  },
  {
    id: "10-24",
    name: "Machine Screw",
    category: "fasteners",
    spec: "#10-24 × 1\"",
    location: "Fastener Bin C-2",
    quantity: 28,
    unit: "pcs",
    lowThreshold: 25,
  },
  {
    id: "pla-yale",
    name: "PLA Filament",
    category: "filament",
    spec: "1.75mm · Yale Blue",
    location: "Dry-box rack · Prusa bay",
    quantity: 6,
    unit: "spools",
    lowThreshold: 2,
  },
  {
    id: "petg-clear",
    name: "PETG Filament",
    category: "filament",
    spec: "1.75mm · Clear",
    location: "Dry-box rack · Bambu bay",
    quantity: 2,
    unit: "spools",
    lowThreshold: 2,
  },
  {
    id: "abs-black",
    name: "ABS Filament",
    category: "filament",
    spec: "1.75mm · Matte Black",
    location: "Dry-box rack · Bambu bay",
    quantity: 1,
    unit: "spools",
    lowThreshold: 2,
  },
  {
    id: "acry-3-clear",
    name: "Cast Acrylic",
    category: "acrylic",
    spec: "3mm · Clear · 12×24\"",
    location: "Plastics Cabinet D1",
    quantity: 9,
    unit: "sheets",
    lowThreshold: 3,
  },
  {
    id: "acry-6-black",
    name: "Cast Acrylic",
    category: "acrylic",
    spec: "6mm · Black · 12×12\"",
    location: "Plastics Cabinet D2",
    quantity: 0,
    unit: "sheets",
    lowThreshold: 2,
  },
  {
    id: "delrin-3",
    name: "Delrin (Acetal)",
    category: "consumables",
    spec: "3mm · Natural · 12×12\"",
    location: "Engineering plastics · Drawer D3",
    quantity: 4,
    unit: "sheets",
    lowThreshold: 2,
  },
  {
    id: "ipa",
    name: "Isopropyl Alcohol",
    category: "consumables",
    spec: "99% · 1L bottle",
    location: "Chem cabinet · South wall",
    quantity: 3,
    unit: "bottles",
    lowThreshold: 2,
  },
  {
    id: "glue-stick",
    name: "Print Bed Glue Stick",
    category: "consumables",
    spec: "Magigoo / PVA",
    location: "Prusa desk caddy",
    quantity: 1,
    unit: "tubes",
    lowThreshold: 2,
  },
];

export const LAB_ANNOUNCEMENTS: LabAnnouncement[] = [
  {
    id: "a1",
    title: "Open hours this week",
    body: "Mon–Thu 12–10pm, Fri 12–6pm. Weekend hours posted in #ceid-floor by Friday noon.",
    postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    tag: "hours",
  },
  {
    id: "a2",
    title: "Epilog #2 exhaust interlock",
    body: "Laser #2 stays offline until facilities clears the exhaust fault. Use Epilog #1 only.",
    postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    tag: "safety",
  },
  {
    id: "a3",
    title: "PETG orange restock",
    body: "Orange PETG arrives Monday. Prefer Clear/Black on X1C #2 until then.",
    postedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    tag: "supply",
  },
];

export const LAB_HOURS = [
  { day: "Mon–Thu", hours: "12:00–22:00" },
  { day: "Friday", hours: "12:00–18:00" },
  { day: "Weekend", hours: "Check Slack" },
];

/** Mimics last automated inventory report sync from CEID staff CSV. */
export const INVENTORY_LAST_REPORT_AT = new Date(
  Date.now() - 47 * 60 * 1000
).toISOString();

export function stockLevel(item: MaterialItem): StockLevel {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.lowThreshold) return "low";
  return "in_stock";
}

export function filterMaterials(
  items: MaterialItem[],
  query: string,
  category: MaterialItem["category"] | "all"
): MaterialItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.spec.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });
}
