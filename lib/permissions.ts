import type { CeidPermissions, CeidRole } from "@/types/ceid";

export function permissionsFor(role: CeidRole | null): CeidPermissions {
  if (!role) {
    return {
      canDiagnose: false,
      canRunDfm: false,
      canParseNewsletter: false,
      canUpdateMachineStatus: false,
      canForceMachineOffline: false,
      canViewRsvpRoster: false,
      canPostAnnouncements: false,
      canOverrideCerts: false,
      canAccessFacultyConsole: false,
      canUseCadStudio: false,
      canUseToolSandbox: false,
    };
  }

  const student: CeidPermissions = {
    canDiagnose: true,
    canRunDfm: true,
    canParseNewsletter: true,
    canUpdateMachineStatus: true,
    canForceMachineOffline: false,
    canViewRsvpRoster: false,
    canPostAnnouncements: false,
    canOverrideCerts: false,
    canAccessFacultyConsole: false,
    canUseCadStudio: true,
    canUseToolSandbox: true,
  };

  if (role === "faculty") {
    return {
      ...student,
      canForceMachineOffline: true,
      canViewRsvpRoster: true,
      canPostAnnouncements: true,
      canOverrideCerts: true,
      canAccessFacultyConsole: true,
    };
  }

  return student;
}
