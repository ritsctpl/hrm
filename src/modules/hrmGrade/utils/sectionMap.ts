/**
 * HRM Grade Module — Permission Section Map
 * Maps UI sections to backend permission object names.
 * Aggregated into hrmAccess/utils/moduleObjectRegistry.ts under HRM_GRADE.
 */

export const GRADE_SECTION_MAP: Record<string, string> = {
  module: 'grade_module',
  master: 'grade_master',
  salaryBand: 'grade_salary_band',
  appraisal: 'grade_appraisal_config',
  progression: 'grade_progression',
};
