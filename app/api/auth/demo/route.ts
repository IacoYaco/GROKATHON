import { NextResponse } from "next/server";
import { getIdentity } from "../../../../cursor/identity";
import { getAccountByCursorSub, upsertAccount } from "@/lib/accounts";
import { isLiveCasConfigured } from "@/lib/cas";
import {
  isDemoAuthAllowed,
  isDemoFacultyAllowed,
} from "@/lib/demo-auth";
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

  if (isLiveCasConfigured()) {
    return NextResponse.json(
      {
        error:
          "Demo login is disabled while Yale CAS is enabled. Sign in with Yale CAS.",
      },
      { status: 403 }
    );
  }

  if (!isDemoAuthAllowed(identity)) {
    return NextResponse.json(
      { error: "Demo login is not available" },
      { status: 403 }
    );
  }

  const existing = await getAccountByCursorSub(identity.sub);
  if (existing?.authSource === "yale_cas") {
    return NextResponse.json(
      {
        error:
          "This account is linked via Yale CAS. Demo login cannot change that role.",
      },
      { status: 403 }
    );
  }

  const parsed = await readJsonLimited<DemoBody>(request, "default");
  if (!parsed.ok) return parsed.response;

  const requestedFaculty = parsed.body.role === "faculty";
  if (requestedFaculty && !isDemoFacultyAllowed(identity)) {
    return NextResponse.json(
      {
        error:
          "Faculty access requires Yale CAS affiliation. Demo faculty is only available in local development.",
      },
      { status: 403 }
    );
  }

  const role: CeidRole =
    requestedFaculty && isDemoFacultyAllowed(identity) ? "faculty" : "student";

  const netid =
    (parsed.body.netid || "huyanh")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 32) || "huyanh";

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
