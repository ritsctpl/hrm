/**
 * Central registry of permission objects per module.
 *
 * Aggregated from each module's `utils/sectionMap.ts`. When the Module
 * Registry form detects a known module code it auto-populates the
 * "Permission Objects" dropdown from this list. Unknown / new modules
 * still allow free-text entry (the Select uses mode="tags").
 *
 * ─── HOW TO ADD OBJECTS FOR A NEW APP ────────────────────────────────
 *
 * 1. Create `src/modules/<yourModule>/utils/sectionMap.ts` following
 *    the pattern below (Record<string, string> of section → objectName).
 *
 * 2. Add an entry here keyed by your MODULE_CODE (must match the code
 *    used in the Module Registry and in <ModuleAccessGate moduleCode>).
 *
 * 3. Each object entry needs:
 *      code  — the backend objectName (snake_case, e.g. "flow_record")
 *      label — human-readable name shown in the form dropdown
 *
 * 4. Use the object codes in your components:
 *      <Can I="edit" object="flow_record">...</Can>
 *
 * That's it. The Permission Matrix, Role Permission Grid, and Module
 * Registry form all read from this registry automatically.
 * ─────────────────────────────────────────────────────────────────────
 */

export interface PermissionObjectEntry {
  code: string;
  label: string;
}

export interface ModuleEntry {
  moduleCode: string;
  appUrl: string;
  objects: PermissionObjectEntry[];
}

const toLabel = (code: string): string =>
  code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * appUrl → moduleCode map. Lets consumers look up objects by route.
 * The appUrl values match the folder names under /rits/ (the Next.js
 * route segments) and the `appUrl` field stored in the backend module
 * registry.
 */
export const APP_URL_TO_MODULE: Record<string, string> = {
  "/rits/hrm_access_app": "HRM_ACCESS",
  "/rits/hrm_announcement_app": "HRM_ANNOUNCEMENT",
  "/rits/hrm_appraisal_app": "HRM_APPRAISAL",
  "/rits/hrm_asset_app": "HRM_ASSET",
  "/rits/hrm_compensation_app": "HRM_COMPENSATION",
  "/rits/hrm_dashboard_app": "HRM_DASHBOARD",
  "/rits/hrm_employee_app": "HRM_EMPLOYEE",
  "/rits/hrm_expense_app": "HRM_EXPENSE",
  "/rits/hrm_holiday_app": "HRM_HOLIDAY",
  "/rits/hrm_leave_app": "HRM_LEAVE",
  "/rits/hrm_notification_app": "HRM_NOTIFICATION",
  "/rits/hrm_organization_app": "HRM_ORGANIZATION",
  "/rits/hrm_payroll_app": "HRM_PAYROLL",
  "/rits/hrm_payslip_app": "HRM_PAYSLIP",
  "/rits/hrm_policy_app": "HRM_POLICY",
  "/rits/hrm_project_app": "HRM_PROJECT",
  "/rits/hrm_settings_app": "HRM_SETTINGS",
  "/rits/hrm_timesheet_app": "HRM_TIMESHEET",
  "/rits/hrm_travel_app": "HRM_TRAVEL",
};

export const MODULE_TO_APP_URL: Record<string, string> = Object.fromEntries(
  Object.entries(APP_URL_TO_MODULE).map(([url, code]) => [code, url]),
);

/**
 * The first entry in each module's list is the ROOT object — it controls
 * module-level V/A/E/D (main record create/edit/delete). Convention:
 * `{prefix}_module` e.g., `employee_module`, `leave_module`.
 */
export function getRootObjectCode(moduleCode: string): string | undefined {
  const objs = MODULE_OBJECT_REGISTRY[moduleCode];
  return objs?.[0]?.code;
}

export const MODULE_OBJECT_REGISTRY: Record<string, PermissionObjectEntry[]> = {
  // ── Access Control ──────────────────────────────────────────────────
  HRM_ACCESS: [
    { code: "access_module", label: "Module Access" },
    { code: "access_role", label: "Roles" },
    { code: "access_permission", label: "Permissions" },
    { code: "access_user_assignment", label: "User Assignment" },
    { code: "access_permission_matrix", label: "Permission Matrix" },
    { code: "access_import_export", label: "Import / Export" },
  ],

  // ── Announcement ────────────────────────────────────────────────────
  HRM_ANNOUNCEMENT: [
    { code: "announcement_module", label: "Module Access" },
    { code: "announcement_record", label: "Announcements" },
    { code: "announcement_category", label: "Categories" },
    { code: "announcement_target_group", label: "Target Groups" },
  ],

  // ── Appraisal ───────────────────────────────────────────────────────
  HRM_APPRAISAL: [
    { code: "appraisal_module", label: "Module Access" },
    { code: "appraisal_cycle", label: "Cycles" },
    { code: "appraisal_goal", label: "Goals" },
    { code: "appraisal_self_assessment", label: "Self Assessment" },
    { code: "appraisal_manager_review", label: "Manager Review" },
    { code: "appraisal_peer_feedback", label: "Peer Feedback" },
    { code: "appraisal_calibration", label: "Calibration" },
    { code: "appraisal_pip", label: "PIP" },
    { code: "appraisal_history", label: "Rating History" },
  ],

  // ── Asset ───────────────────────────────────────────────────────────
  HRM_ASSET: [
    { code: "asset_module", label: "Module Access" },
    { code: "asset_record", label: "Assets" },
    { code: "asset_assignment", label: "Assignments" },
    { code: "asset_category", label: "Categories" },
    { code: "asset_maintenance", label: "Maintenance" },
    { code: "asset_history", label: "History" },
  ],

  // ── Compensation ────────────────────────────────────────────────────
  HRM_COMPENSATION: [
    { code: "compensation_module", label: "Module Access" },
    { code: "compensation_salary_structure", label: "Salary Structure" },
    { code: "compensation_pay_component", label: "Pay Components" },
    { code: "compensation_employee", label: "Employee Compensation" },
    { code: "compensation_revision", label: "Salary Revision" },
    { code: "compensation_approval", label: "Approvals" },
  ],

  // ── Dashboard ───────────────────────────────────────────────────────
  HRM_DASHBOARD: [
    { code: "dashboard_module", label: "Module Access" },
    { code: "dashboard_admin", label: "Admin Widgets" },
    { code: "dashboard_hr", label: "HR Widgets" },
    { code: "dashboard_manager", label: "Manager Widgets" },
    { code: "dashboard_employee", label: "Employee Widgets" },
  ],

  // ── Employee ────────────────────────────────────────────────────────
  HRM_EMPLOYEE: [
    { code: "employee_module", label: "Module Access" },
    { code: "employee_record", label: "Employee Record" },
    { code: "employee_personal", label: "Personal Details" },
    { code: "employee_official", label: "Official Details" },
    { code: "employee_contact", label: "Contact Details" },
    { code: "employee_compensation", label: "Compensation" },
    { code: "employee_bank", label: "Bank Details" },
    { code: "employee_document", label: "Documents" },
    { code: "employee_education", label: "Education" },
    { code: "employee_skill", label: "Skills" },
    { code: "employee_job_history", label: "Job History" },
    { code: "employee_experience", label: "Experience" },
    { code: "employee_training", label: "Training & Certifications" },
    { code: "employee_asset", label: "Assets" },
    { code: "employee_emergency_contact", label: "Emergency Contact" },
    { code: "employee_family", label: "Family Details" },
    { code: "employee_employment", label: "Employment Details" },
    { code: "employee_reporting", label: "Reporting Structure" },
    { code: "employee_onboarding", label: "Onboarding" },
    { code: "employee_bulk_import", label: "Bulk Import" },
    { code: "employee_offboarding", label: "Offboarding" },
    { code: "employee_audit_log", label: "Audit Log" },
    { code: "employee_alerts", label: "Alerts" },
    { code: "employee_export", label: "Export" },
    { code: "employee_field_schema", label: "Field Configuration" },
  ],

  // ── Expense ─────────────────────────────────────────────────────────
  HRM_EXPENSE: [
    { code: "expense_module", label: "Module Access" },
    { code: "expense_record", label: "Expenses" },
    { code: "expense_approval", label: "Approval Queue" },
    { code: "expense_finance_approval", label: "Finance Approval" },
    { code: "expense_category", label: "Categories" },
    { code: "expense_attachment", label: "Attachments" },
    { code: "expense_mileage", label: "Mileage" },
    { code: "expense_history", label: "History" },
  ],

  // ── Holiday ─────────────────────────────────────────────────────────
  HRM_HOLIDAY: [
    { code: "holiday_module", label: "Module Access" },
    { code: "holiday_record", label: "Holidays" },
    { code: "holiday_calendar", label: "Calendar" },
    { code: "holiday_policy", label: "Policy" },
  ],

  // ── Leave ───────────────────────────────────────────────────────────
  HRM_LEAVE: [
    { code: "leave_module", label: "Module Access" },
    { code: "leave_request", label: "Leave Request" },
    { code: "leave_balance", label: "Balance" },
    { code: "leave_policy", label: "Policy" },
    { code: "leave_approval", label: "Approval Queue" },
    { code: "leave_hr_queue", label: "HR Queue" },
    { code: "leave_calendar", label: "Calendar" },
    { code: "leave_team_calendar", label: "Team Calendar" },
    { code: "leave_accrual", label: "Accrual" },
    { code: "leave_comp_off", label: "Comp Off" },
    { code: "leave_adjustment", label: "Ledger Adjustment" },
    { code: "leave_ledger", label: "Ledger" },
    { code: "leave_report", label: "Reports" },
    { code: "leave_year_end", label: "Year-End Operations" },
    { code: "leave_payroll_export", label: "Payroll Export" },
    { code: "leave_payroll_lock", label: "Payroll Lock" },
    { code: "leave_approval_config", label: "Approval Config" },
  ],

  // ── Notification ────────────────────────────────────────────────────
  HRM_NOTIFICATION: [
    { code: "notification_module", label: "Module Access" },
    { code: "notification_record", label: "Notifications" },
    { code: "notification_preference", label: "Preferences" },
    { code: "notification_template", label: "Templates" },
  ],

  // ── Organization ────────────────────────────────────────────────────
  HRM_ORGANIZATION: [
    { code: "org_module", label: "Module Access" },
    { code: "org_company_profile", label: "Company Profile" },
    { code: "org_identity", label: "Company Identity" },
    { code: "org_statutory", label: "Statutory Details" },
    { code: "org_addresses", label: "Addresses" },
    { code: "org_bank_accounts", label: "Bank Accounts" },
    { code: "org_financial_year", label: "Financial Year" },
    { code: "org_department", label: "Departments" },
    { code: "org_designation", label: "Designations" },
    { code: "org_position", label: "Positions" },
    { code: "org_chart", label: "Org Chart" },
    { code: "org_location", label: "Locations" },
    { code: "org_business_unit", label: "Business Units" },
  ],

  // ── Payroll ─────────────────────────────────────────────────────────
  HRM_PAYROLL: [
    { code: "payroll_module", label: "Module Access" },
    { code: "payroll_dashboard", label: "Dashboard" },
    { code: "payroll_run", label: "Payroll Runs" },
    { code: "payroll_wizard", label: "Wizard" },
    { code: "payroll_review", label: "Review" },
    { code: "payroll_tax_config", label: "Tax Configuration" },
    { code: "payroll_statutory", label: "Statutory Config" },
    { code: "payroll_pt_slab", label: "PT Slabs" },
    { code: "payroll_alert", label: "Alerts" },
  ],

  // ── Payslip ─────────────────────────────────────────────────────────
  HRM_PAYSLIP: [
    { code: "payslip_module", label: "Module Access" },
    { code: "payslip_record", label: "Payslips" },
    { code: "payslip_generate", label: "Generate" },
    { code: "payslip_repository", label: "Repository" },
    { code: "payslip_template", label: "Templates" },
    { code: "payslip_history", label: "History" },
    { code: "payslip_download", label: "Download" },
  ],

  // ── Policy ──────────────────────────────────────────────────────────
  HRM_POLICY: [
    { code: "policy_module", label: "Module Access" },
    { code: "policy_record", label: "Policies" },
    { code: "policy_category", label: "Categories" },
    { code: "policy_acknowledgement", label: "Acknowledgements" },
    { code: "policy_version", label: "Versions" },
  ],

  // ── Project ─────────────────────────────────────────────────────────
  HRM_PROJECT: [
    { code: "project_module", label: "Module Access" },
    { code: "project_record", label: "Projects" },
    { code: "project_task", label: "Tasks" },
    { code: "project_member", label: "Members" },
    { code: "project_milestone", label: "Milestones" },
    { code: "project_time_log", label: "Time Logs" },
    { code: "project_allocation", label: "Resource Allocation" },
    { code: "project_approval", label: "Allocation Approvals" },
    { code: "project_calendar", label: "Calendar" },
    { code: "project_report", label: "Reports" },
  ],

  // ── Settings ────────────────────────────────────────────────────────
  HRM_SETTINGS: [
    { code: "settings_module", label: "Module Access" },
    { code: "settings_profile", label: "Profile" },
    { code: "settings_security", label: "Security" },
    { code: "settings_notification", label: "Notifications" },
    { code: "settings_preference", label: "Preferences" },
    { code: "settings_support", label: "Support" },
  ],

  // ── Timesheet ───────────────────────────────────────────────────────
  HRM_TIMESHEET: [
    { code: "timesheet_module", label: "Module Access" },
    { code: "timesheet_record", label: "Timesheets" },
    { code: "timesheet_approval", label: "Approval Queue" },
    { code: "timesheet_calendar", label: "Calendar" },
    { code: "timesheet_report", label: "Reports" },
    { code: "timesheet_settings", label: "Settings" },
  ],

  // ── Travel ──────────────────────────────────────────────────────────
  HRM_TRAVEL: [
    { code: "travel_module", label: "Module Access" },
    { code: "travel_request", label: "Travel Requests" },
    { code: "travel_approval", label: "Approval Queue" },
    { code: "travel_attachment", label: "Attachments" },
    { code: "travel_co_traveller", label: "Co-Travellers" },
    { code: "travel_policy", label: "Policy" },
    { code: "travel_history", label: "History" },
  ],
};

export function getObjectsForModule(moduleCode: string): PermissionObjectEntry[] {
  return MODULE_OBJECT_REGISTRY[moduleCode] ?? [];
}

export function getObjectsByAppUrl(appUrl: string): PermissionObjectEntry[] {
  const moduleCode = APP_URL_TO_MODULE[appUrl];
  return moduleCode ? getObjectsForModule(moduleCode) : [];
}

export function getModuleCodeByAppUrl(appUrl: string): string | undefined {
  return APP_URL_TO_MODULE[appUrl];
}

export function getAppUrlByModuleCode(moduleCode: string): string | undefined {
  return MODULE_TO_APP_URL[moduleCode];
}

export function getObjectCodesForModule(moduleCode: string): string[] {
  return getObjectsForModule(moduleCode).map((o) => o.code);
}

export function getObjectLabel(code: string): string {
  for (const entries of Object.values(MODULE_OBJECT_REGISTRY)) {
    const match = entries.find((e) => e.code === code);
    if (match) return match.label;
  }
  return toLabel(code);
}

export function getAllModuleEntries(): ModuleEntry[] {
  return Object.entries(MODULE_OBJECT_REGISTRY).map(([moduleCode, objects]) => ({
    moduleCode,
    appUrl: MODULE_TO_APP_URL[moduleCode] ?? "",
    objects,
  }));
}
