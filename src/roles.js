// src/roles.js
//
 // Primary source of truth for HR roles is the public.hr_staff table
// (see migration 20260817160000_hr_staff_and_storage_notes.sql).
// This client-side map is kept as a fast fallback / offline reference
// and for the period before the migration is applied.

export const ROLES = {
  HR_DIRECTOR: "hr_director",
  HR_MANAGER: "hr_manager",
  HR_OFFICER: "hr_officer",
  ADMIN: "admin",
};

// Map emails to roles (mirrors the seed data in hr_staff)
const USER_ROLES = {
  // Head of HR
  "wamusheke-yvonne.simenda@huaxin.com": ROLES.HR_DIRECTOR,

  // HR Managers
  "nduwa.mtonga@huaxin.com": ROLES.HR_MANAGER,
  "mulenga.mutale@huaxin.com": ROLES.HR_MANAGER,

  // Admin / Testing
  "kudzanai.siame@huaxincem.com": ROLES.ADMIN,
};

// Permissions for each role
const PERMISSIONS = {
  [ROLES.HR_DIRECTOR]: {
    canViewDashboard: true,
    canPostJobs: true,
    canApproveJobs: true,
    canUpdateApplicationStatus: true,
    canExportCSV: true,
  },
  [ROLES.HR_MANAGER]: {
    canViewDashboard: true,
    canPostJobs: true,
    canApproveJobs: true,
    canUpdateApplicationStatus: true,
    canExportCSV: true,
  },
  [ROLES.HR_OFFICER]: {
    canViewDashboard: true,
    canPostJobs: true,
    canApproveJobs: false,          // cannot approve
    canUpdateApplicationStatus: true,
    canExportCSV: true,
  },
  [ROLES.ADMIN]: {
    canViewDashboard: true,
    canPostJobs: true,
    canApproveJobs: true,
    canUpdateApplicationStatus: true,
    canExportCSV: true,
  },
};

export function getUserRole(email) {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  return USER_ROLES[normalized] || null;
}

export function getPermissions(email) {
  const role = getUserRole(email);

  // Fallback: if email belongs to company domain but no specific role → treat as HR Officer
  // (Database is_hr() also accepts these domains as a temporary safety net.)
  if (!role) {
    const isCompanyEmail =
      email?.toLowerCase().includes("@huaxin.com") ||
      email?.toLowerCase().includes("@huaxincem.com") ||
      email?.toLowerCase().includes("@chilangacement.co.zm");

    if (isCompanyEmail) {
      return PERMISSIONS[ROLES.HR_OFFICER];
    }
    return null;
  }

  return PERMISSIONS[role];
}

export function canApproveJobs(email) {
  const perms = getPermissions(email);
  return perms?.canApproveJobs === true;
}
