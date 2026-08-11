// src/roles.js

export const ROLES = {
  HR_DIRECTOR: "hr_director",
  HR_MANAGER: "hr_manager",
  HR_OFFICER: "hr_officer",
  ADMIN: "admin",
};

// Map emails to roles
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
