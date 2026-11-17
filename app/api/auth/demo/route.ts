import { NextResponse } from "next/server";
import { getIdentity } from "../../../../cursor/identity";
import { upsertAccount } from "@/lib/accounts";
import { readJsonLimited } from "@/lib/request-guards";
import type { CeidRole } from "@/types/ceid";

interface DemoBody {
  role?: CeidRole;
  netid?: string;
  displayName?: string;
  college?: string;
  classYear?: string;
}

export async function POST(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified || identity.kind === "key") {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const parsed = await readJsonLimited<DemoBody>(request, "default");
  if (!parsed.ok) return parsed.response;

  const role = parsed.body.role === "faculty" ? "faculty" : "student";
  const netid = (parsed.body.netid || "huyanh").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 32) || "huyanh";

  const account = await upsertAccount({
    cursorSub: identity.sub,
    netid,
    displayName:
      parsed.body.displayName ||
      identity.name ||
      (role === "faculty" ? "CEID Faculty" : "Huy Anh"),
    email: identity.email || `${netid}@yale.edu`,
    role,
    affiliations:
      role === "faculty"
        ? ["faculty", "member", "employee"]
        : ["student", "member"],
    authSource: "demo",
    college: parsed.body.college || (role === "student" ? "Pierson" : "CEID"),
    classYear: parsed.body.classYear || (role === "student" ? "'30" : ""),
  });

  return NextResponse.json(
    { account },
    { headers: { "cache-control": "private, no-store" } }
  );
}
