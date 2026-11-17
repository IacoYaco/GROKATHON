import { NextResponse } from "next/server";
import { getIdentity } from "../../../../../cursor/identity";
import { upsertAccount } from "@/lib/accounts";
import {
  isLiveCasConfigured,
  mapAffiliationsToRole,
  validateCasTicket,
} from "@/lib/cas";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const identity = await getIdentity(request);
  if (!identity.verified || identity.kind === "key") {
    return NextResponse.redirect(`${origin}/?auth=identity_required`);
  }

  if (!isLiveCasConfigured()) {
    return NextResponse.redirect(`${origin}/?auth=cas_disabled`);
  }

  const ticket = new URL(request.url).searchParams.get("ticket");
  if (!ticket) {
    return NextResponse.redirect(`${origin}/?auth=missing_ticket`);
  }

  try {
    const service = `${origin}/api/auth/cas/callback`;
    const cas = await validateCasTicket(ticket, service);
    const role = mapAffiliationsToRole(cas.affiliations);
    await upsertAccount({
      cursorSub: identity.sub,
      netid: cas.netid,
      displayName: cas.displayName || identity.name || cas.netid,
      email: cas.email || identity.email || `${cas.netid}@yale.edu`,
      role,
      affiliations: cas.affiliations,
      authSource: "yale_cas",
    });
    return NextResponse.redirect(`${origin}/?auth=linked`);
  } catch {
    return NextResponse.redirect(`${origin}/?auth=cas_failed`);
  }
}
