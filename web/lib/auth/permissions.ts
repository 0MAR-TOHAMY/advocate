/**
 * System-wide Permission Keys
 * These must match the 'key' column in the `permissions` table.
 */

export const Permissions = {
    // Case Management
    CASES_VIEW: "cases:view",
    CASES_CREATE: "cases:create",
    CASES_EDIT: "cases:edit",
    CASES_DELETE: "cases:delete",
    CASES_VIEW_SENSITIVE: "cases:view_sensitive", // View sensitive details like financial

    // Client Management
    CLIENTS_VIEW: "clients:view",
    CLIENTS_CREATE: "clients:create",
    CLIENTS_EDIT: "clients:edit",
    CLIENTS_DELETE: "clients:delete",

    // General Work
    GENERAL_WORK_VIEW: "general_work:view",
    GENERAL_WORK_CREATE: "general_work:create",
    GENERAL_WORK_EDIT: "general_work:edit",
    GENERAL_WORK_DELETE: "general_work:delete",

    // Document Management
    DOCUMENTS_VIEW_ALL: "documents:view_all", // View all firm documents (admin dashboard)
    DOCUMENTS_UPLOAD: "documents:upload",
    DOCUMENTS_DELETE: "documents:delete",

    // Financials & Billing
    FINANCIALS_VIEW: "financials:view",
    FINANCIALS_MANAGE: "financials:manage", // Process payments, refunds
    INVOICES_CREATE: "invoices:create",

    // Firm Management (Admin)
    FIRM_SETTINGS_VIEW: "firm_settings:view",
    FIRM_SETTINGS_MANAGE: "firm_settings:manage",
    USERS_MANAGE: "users:manage", // Invite, Suspend, Change Roles
    ROLES_MANAGE: "roles:manage", // Create/Edit Roles
    PERMISSIONS_MANAGE: "permissions:manage", // Assign granular permissions

    // Reports
    REPORTS_VIEW: "reports:view",
    REPORTS_EXPORT: "reports:export",

    // Calendar & Reminders
    CALENDAR_VIEW_PERSONAL: "calendar:view_personal",
    CALENDAR_VIEW_FIRM: "calendar:view_firm",
    CALENDAR_MANAGE_OWN: "calendar:manage_own",
    CALENDAR_MANAGE_FIRM: "calendar:manage_firm",

    // Reminders
    REMINDERS_MANAGE_OWN: "reminders:manage_own",
    REMINDERS_VIEW_FIRM: "reminders:view_firm",
    REMINDERS_MANAGE_FIRM: "reminders:manage_firm",
} as const;

export type PermissionKey = typeof Permissions[keyof typeof Permissions];
