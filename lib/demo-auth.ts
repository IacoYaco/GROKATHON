import { isLiveCasConfigured } from "@/lib/cas";

/** Demo NetID linking is for local/dev only — never when live Yale CAS is on. */
export function isDemoAuthAllowed(identity: {
  simulated?: boolean;
}): boolean {
  if (isLiveCasConfigured()) return false;
  // Published app: students may use demo until ITS registers CAS.
  // Faculty via demo is never allowed for real (non-simulated) viewers.
  return true;
}

/** Faculty role from demo is local-preview only — never for published invitees. */
export function isDemoFacultyAllowed(identity: {
  simulated?: boolean;
}): boolean {
  if (isLiveCasConfigured()) return false;
  return Boolean(identity.simulated);
}
