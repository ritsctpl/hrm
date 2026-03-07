// UI state and component prop types

export type AppraisalScreenView =
  | "LANDING"
  | "GOAL_SETTING"
  | "SELF_ASSESSMENT"
  | "MANAGER_REVIEW"
  | "FEEDBACK_360"
  | "APPRAISAL_SUMMARY"
  | "CALIBRATION"
  | "PIP";

export type GoalFormState = "CREATE" | "EDIT";

export interface CalibrationFilters {
  cycleId: string;
  department: string;
}

export interface GoalCardProps {
  goal: import("./domain.types").AppraisalGoal;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onProgressUpdate: (goalId: string, krId: string, value: number) => void;
}

export interface RatingStarInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
  labels?: string[];
}

export interface BellCurveChartProps {
  distribution: import("./domain.types").RatingDistribution;
  highlightEmployeeRating?: number;
  height?: number;
}

export interface RadarChartProps {
  competencies: string[];
  selfRatings: number[];
  managerRatings: number[];
  peerAvgRatings: number[];
  height?: number;
}

export interface PhaseTimelineProps {
  phases: import("./domain.types").AppraisalPhase[];
  currentPhaseType: import("./domain.types").PhaseType;
}

export interface CalibrationTableRowData {
  reviewId: string;
  employeeName: string;
  department: string;
  selfRating: number;
  managerRating: number;
  proposedRating: number;
  calibratedRating: number;
  calibrationNotes: string;
}
