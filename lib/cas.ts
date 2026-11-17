import type { CeidRole } from "@/types/ceid";

export const YALE_CAS_BASE =
  process.env.YALE_CAS_BASE_URL?.replace(/\/$/, "") ||
  "https://secure.its.yale.edu/cas";

export function isLiveCasConfigured(): boolean {
  return process.env.YALE_CAS_ENABLED === "true";
}

export function casLoginUrl(serviceUrl: string): string {
  return `${YALE_CAS_BASE}/login?service=${encodeURIComponent(serviceUrl)}`;
}

export function casLogoutUrl(serviceUrl: string): string {
  return `${YALE_CAS_BASE}/logout?service=${encodeURIComponent(serviceUrl)}`;
}

export interface CasValidation {
  netid: string;
  affiliations: string[];
  email?: string;
  displayName?: string;
}

export function mapAffiliationsToRole(affiliations: string[]): CeidRole {
  const lower = affiliations.map((a) => a.toLowerCase());
  if (
    lower.some((a) =>
      ["faculty", "employee", "staff", "instructor", "professor"].includes(a)
    )
  ) {
    return "faculty";
  }
  return "student";
}

export async function validateCasTicket(
  ticket: string,
  serviceUrl: string
): Promise<CasValidation> {
  const url = `${YALE_CAS_BASE}/serviceValidate?ticket=${encodeURIComponent(
    ticket
  )}&service=${encodeURIComponent(serviceUrl)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`CAS validate HTTP ${res.status}`);
  }
  const xml = await res.text();
  if (!xml.includes("authenticationSuccess")) {
    throw new Error("CAS ticket validation failed");
  }
  const netid = matchTag(xml, "user");
  if (!netid) throw new Error("CAS response missing NetID");

  const affiliations = [
    ...matchAllTags(xml, "eduPersonAffiliation"),
    ...matchAllTags(xml, "affiliation"),
    ...matchAllTags(xml, "yaleEduPersonPrimaryAffiliation"),
  ];

  return {
    netid,
    affiliations,
    email: matchTag(xml, "email") || `${netid}@yale.edu`,
    displayName:
      matchTag(xml, "displayName") ||
      matchTag(xml, "cn") ||
      netid,
  };
}

function matchTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<(?:cas:)?${tag}[^>]*>([^<]+)<\\/(?:cas:)?${tag}>`, "i");
  const m = xml.match(re);
  return m?.[1]?.trim();
}

function matchAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(
    `<(?:cas:)?${tag}[^>]*>([^<]+)<\\/(?:cas:)?${tag}>`,
    "gi"
  );
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}
