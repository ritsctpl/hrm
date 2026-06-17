/**
 * HRM Grade Module — Domain Types
 * Business entity interfaces for the Employee Grade master.
 *
 * A Grade is a first-class org master that downstream modules consume:
 *   - Compensation: salaryBand drives the pay range for the grade.
 *   - Appraisal:    appraisalConfig drives cycle + eligibility + rating scale.
 *   - Opportunities: progression drives promotion / career-path candidates.
 */

export type GradeTrack =
  | 'ENGINEERING'
  | 'MANAGEMENT'
  | 'OPERATIONS'
  | 'SALES'
  | 'SUPPORT'
  | 'GENERAL';

export type AppraisalCycle = 'ANNUAL' | 'HALF_YEARLY' | 'QUARTERLY';

/** Pay range associated with a grade — consumed by hrmCompensation (Phase 2). */
export interface SalaryBand {
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  currency: string;
}

/** Appraisal defaults associated with a grade — consumed by hrmAppraisal (Phase 3). */
export interface AppraisalConfig {
  cycle: AppraisalCycle;
  /** Min months an employee must hold the grade before becoming appraisal-eligible. */
  eligibilityMonths: number;
  /** Name / code of the rating scale applied at this grade. */
  ratingScale: string;
}

/** Career-path / promotion config — drives "opportunities" (Phase 3). */
export interface ProgressionConfig {
  /** Grade codes an employee at this grade can be promoted into. */
  nextGradeCodes: string[];
  /** Min tenure (months) in this grade before promotion eligibility. */
  minTenureMonths: number;
}

export interface Grade {
  handle: string;
  site?: string;
  organizationId: string;
  gradeCode: string;
  gradeName: string;
  /** Numeric rank — drives ordering and progression comparisons. Lower = junior. */
  level: number;
  track: GradeTrack;
  description?: string;
  salaryBand: SalaryBand;
  appraisalConfig: AppraisalConfig;
  progression: ProgressionConfig;
  effectiveFrom: string;
  active: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

/**
 * Employee surfaced as a promotion candidate for a target grade.
 * Returned by getPromotionCandidates (Phase 3 — BE pending).
 */
export interface PromotionCandidate {
  employeeId: string;
  employeeName: string;
  currentGradeCode: string;
  targetGradeCode: string;
  tenureMonths: number;
  lastAppraisalRating?: string;
  eligible: boolean;
}
