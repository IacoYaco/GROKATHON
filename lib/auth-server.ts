import { getIdentity } from "../cursor/identity";
import { getAccountByCursorSub } from "@/lib/accounts";
import { isLiveCasConfigured } from "@/lib/cas";
import {
  isDemoAuthAllowed,
  isDemoFacultyAllowed,
} from "@/lib/demo-auth";
import { permissionsFor } from "@/lib/permissions";
import type { CeidAccount, CeidPermissions } from "@/types/ceid";

export async function resolveCeidSession(request: Request): Promise<{
  identityVerified: boolean;
  identityName: string;
  identityEmail: string;
  simulated: boolean;
  account: CeidAccount | null;
  permissions: CeidPermissions;
  casLive: boolean;
  demoAuthAllowed: boolean;
  demoFacultyAllowed: boolean;
  cursorSub: string | null;
}> {
  const identity = await getIdentity(request);
  if (!identity.verified || identity.kind === "key") {
    return {
      identityVerified: false,
      identityName: "",
      identityEmail: "",
      simulated: false,
      account: null,
      permissions: permissionsFor(null),
      casLive: isLiveCasConfigured(),
      demoAuthAllowed: false,
      demoFacultyAllowed: false,
      cursorSub: null,
    };
  }

  const account = await getAccountByCursorSub(identity.sub);
  return {
    identityVerified: true,
    identityName: identity.name,
    identityEmail: identity.email,
    simulated: Boolean(identity.simulated),
    account,
    permissions: permissionsFor(account?.role ?? null),
    casLive: isLiveCasConfigured(),
    demoAuthAllowed: isDemoAuthAllowed(identity),
    demoFacultyAllowed: isDemoFacultyAllowed(identity),
    cursorSub: identity.sub,
  };
}
