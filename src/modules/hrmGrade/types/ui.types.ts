/**
 * HRM Grade Module — UI Types
 * Component prop types and form state shapes.
 */

import type { Grade, GradeTrack, AppraisalCycle } from './domain.types';

export interface GradeFormState {
  gradeCode: string;
  gradeName: string;
  level: number;
  track: GradeTrack;
  description?: string;
  // Salary band (flattened for the form)
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  currency: string;
  // Appraisal config (flattened)
  cycle: AppraisalCycle;
  eligibilityMonths: number;
  ratingScale: string;
  // Progression (flattened)
  nextGradeCodes: string[];
  minTenureMonths: number;
  effectiveFrom: string;
}

export interface GradeListProps {
  grades: Grade[];
  loading: boolean;
  selectedCode: string | null;
  onSelect: (grade: Grade) => void;
  onNew: () => void;
}

export interface GradeListRowProps {
  grade: Grade;
  selected: boolean;
  onClick: () => void;
}

export interface GradeFormProps {
  grade: Grade | null;
  allGrades: Grade[];
  onSave: (data: GradeFormState, handle?: string) => Promise<void>;
  onDeactivate: (gradeCode: string) => Promise<void>;
  onCancel: () => void;
}

export interface GradeLevelBadgeProps {
  level: number;
}
