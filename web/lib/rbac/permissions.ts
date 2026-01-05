export const PermissionKeys = {
  FirmViewDashboard: 'firm.view_dashboard',
  FirmManageSettings: 'firm.manage_settings',
  FirmViewSettings: 'firm.view_settings',
  FirmSettingsView: 'firm.view_settings', // Alias for compatibility
  FirmManageUsers: 'firm.manage_users',
  FirmManageRoles: 'firm.manage_roles',
  FirmManageRequests: 'firm.manage_requests',
} as const;

export type PermissionKey = typeof PermissionKeys[keyof typeof PermissionKeys];