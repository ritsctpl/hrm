import type { PayslipTabKey } from "../types/ui.types";

/** The RBAC-derived capabilities that decide which payslip tabs a user sees. */
export interface PayslipTabPermissions {
  /** Backend UPLOAD: `payslip_module|ADD` (see PayslipPermission.UPLOAD, ruling R6 option i). */
  canUpload: boolean;
  /** Backend VIEW_REPOSITORY: `payslip_repository|VIEW`, no root cascade. */
  canViewRepository: boolean;
  /** `payslip_generate|VIEW`. */
  canViewGeneration: boolean;
  /** `payslip_template|VIEW`. */
  canViewTemplates: boolean;
}

/**
 * The payslip tabs a user may see, in display order. "My Payslips" is self-service and always
 * present; every other tab needs the matching grant. Replaces the old `role` cookie gate.
 */
export function visiblePayslipTabs(p: PayslipTabPermissions): PayslipTabKey[] {
  const keys: PayslipTabKey[] = [];
  if (p.canUpload) keys.push("upload");
  keys.push("myPayslips");
  if (p.canViewRepository) keys.push("repository", "uploadHistory");
  if (p.canViewGeneration) keys.push("generate");
  if (p.canViewTemplates) keys.push("templates");
  return keys;
}
