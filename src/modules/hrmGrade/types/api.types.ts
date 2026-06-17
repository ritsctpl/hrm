/**
 * HRM Grade Module — API Request/Response Types
 * Shapes sent to /hrm-service/grade endpoints.
 */

import type {
  GradeTrack,
  AppraisalCycle,
  SalaryBand,
  AppraisalConfig,
  ProgressionConfig,
} from './domain.types';

export interface GradeRequest {
  organizationId: string;
  gradeCode: string;
  gradeName: string;
  level: number;
  track: GradeTrack;
  description?: string;
  salaryBand: SalaryBand;
  appraisalConfig: AppraisalConfig;
  progression: ProgressionConfig;
  effectiveFrom: string;
  /** Present on update only. */
  handle?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface DeactivateGradeRequest {
  organizationId: string;
  gradeCode: string;
  updatedBy: string;
}

export interface DeleteGradeRequest {
  organizationId: string;
  gradeId: string;
  deletedBy: string;
}

export interface GetPromotionCandidatesRequest {
  organizationId: string;
  gradeCode: string;
}

export type { GradeTrack, AppraisalCycle };
