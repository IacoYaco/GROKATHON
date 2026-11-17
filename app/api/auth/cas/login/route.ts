import { NextResponse } from "next/server";
import { getIdentity } from "../../../../../cursor/identity";
import { casLoginUrl, isLiveCasConfigured } from "@/lib/cas";

export async function GET(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified || identity.kind === "key") {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!isLiveCasConfigured()) {
    return NextResponse.json(
      {
        error:
          "Yale CAS live mode is not enabled yet. Use Demo Yale ID on the login screen, or set YALE_CAS_ENABLED=true after ITS registers this service.",
        casLive: false,
      },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  const service = `${origin}/api/auth/cas/callback`;
  return NextResponse.redirect(casLoginUrl(service));
}
