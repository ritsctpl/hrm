// Domain entity types

export type CycleType = "ANNUAL" | "SEMI_ANNUAL" | "QUARTERLY" | "PROBATION";
export type CycleStatus =
  | "DRAFT"
  | "GOAL_SETTING"
  | "IN_PROGRESS"
  | "CALIBRATION"
  | "COMPLETED"
  | "ARCHIVED";
export type PhaseType =
  | "GOAL_SETTING"
  | "SELF_ASSESSMENT"
  | "MANAGER_ASSESSMENT"
  | "MANAGER_REVIEW"
  | "PEER_FEEDBACK"
  | "CALIBRATION"
  | "SIGN_OFF";
export type PhaseStatus = "NOT_STARTED" | "OPEN" | "CLOSED";
export type GoalCategory = "BUSINESS" | "DEVELOPMENT" | "STRETCH" | "LEARNING";
export type GoalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DEFERRED"
  | "CANCELLED";
export type ReviewStatus =
  | "PENDING_SELF"
  | "PENDING_MANAGER"
  | "PENDING_CALIBRATION"
  | "PENDING_SIGN_OFF"
  | "COMPLETED";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type FeedbackType = "PRAISE" | "CONSTRUCTIVE" | "SUGGESTION" | "CHECK_IN";
export type Visibility = "PRIVATE" | "MANAGER_VISIBLE" | "PUBLIC";
export type CompetencyCategory = "CORE" | "FUNCTIONAL" | "LEADERSHIP";

export interface RatingEntry {
  value: number;
  label: string;
  description: string;
  color?: string;
}

export interface RatingScale {
  scaleId: string;
  scaleName: string;
  ratings: RatingEntry[];
}

export interface BehavioralIndicator {
  ratingValue: number;
  description: string;
}

export interface CompetencyDefinition {
  competencyId: string;
  name: string;
  category: CompetencyCategory;
  description: string;
  weightPercentage: number;
  behavioralIndicators: BehavioralIndicator[];
}

export interface BellCurveTarget {
  ratingValue: number;
  label: string;
  minPercentage: number;
  maxPercentage: number;
}

export interface AppraisalPhase {
  phaseId: string;
  phaseName: string;
  phaseType: PhaseType;
  startDate: string;
  endDate: string;
  status: PhaseStatus;
  sequenceOrder: number;
}

export interface AppraisalCycle {
  handle?: string;
  cycleId: string;
  cycleName: string;
  cycleType: CycleType;
  status: CycleStatus;
  periodStart: string;
  periodEnd: string;
  phases: AppraisalPhase[];
  ratingScale: RatingScale;
  competencyFramework: CompetencyDefinition[];
  goalWeightPercentage: number;
  competencyWeightPercentage: number;
  bellCurveEnabled: boolean;
  bellCurveTargets: BellCurveTarget[];
  applicableDepartments: string[];
  applicableBusinessUnits: string[];
  totalEmployees: number;
  completedReviews: number;
  messageDetails?: unknown;
}

export interface KeyResult {
  keyResultId: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: string;
  updateNote?: string;
  lastUpdated?: string;
}

export interface GoalEvidence {
  documentId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedDate: string;
  uploadedBy: string;
  description?: string;
}

export interface AppraisalGoal {
  handle?: string;
  goalId: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  goalTitle: string;
  goalDescription: string;
  goalCategory: GoalCategory;
  keyResults: KeyResult[];
  weightPercentage: number;
  priority: Priority;
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  selfRating: number;
  selfComments: string;
  managerRating: number;
  managerComments: string;
  achievementPercentage: number;
  evidence: GoalEvidence[];
}

export interface CompetencyRating {
  competencyId: string;
  competencyName: string;
  rating: number;
  comments: string;
  behavioralObservations?: string;
}

export interface SelfAssessmentData {
  overallRating: number;
  overallComments: string;
  submittedDate: string;
  competencyRatings: CompetencyRating[];
  keyAccomplishments?: string;
  developmentGoals?: string;
  supportNeeded?: string;
}

export interface ManagerAssessmentData {
  overallRating: number;
  overallComments: string;
  strengths: string[];
  areasOfImprovement: string[];
  submittedDate: string;
  competencyRatings: CompetencyRating[];
  recommendedRating: number;
  promotionRecommendation: boolean;
  promotionRecommendationReason?: string;
  compensationRecommendation: string;
  developmentPlan?: string;
}

export interface PeerFeedbackEntry {
  peerId: string;
  peerName: string;
  relationship: string;
  ratings: CompetencyRating[];
  overallRating?: number;
  overallComments: string;
  submittedDate: string;
  anonymous: boolean;
}

export interface CalibrationData {
  calibratedRating: number;
  calibratedBy: string;
  calibrationDate: string;
  calibrationNotes: string;
  ratingBeforeCalibration: number;
  calibrationJustification?: string;
}

export interface SignOffStatus {
  employeeAcknowledged: boolean;
  employeeAcknowledgedDate: string;
  employeeDisagrees?: boolean;
  employeeDisagreeComments?: string;
  managerSignedOff: boolean;
  managerSignOffDate: string;
  hrSignedOff: boolean;
  hrSignedOffBy?: string;
  hrSignOffDate: string;
}

export interface AppraisalReview {
  handle?: string;
  reviewId: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  reportingManagerName: string;
  reportingManagerId: string;
  status: ReviewStatus;
  goalWeightedScore?: number;
  competencyWeightedScore?: number;
  calculatedRating?: number;
  selfAssessment: SelfAssessmentData;
  managerAssessment: ManagerAssessmentData;
  peerFeedback: PeerFeedbackEntry[];
  calibration: CalibrationData;
  finalRating: number;
  finalRatingLabel: string;
  signOff: SignOffStatus;
  goals: AppraisalGoal[];
  pipHandle?: string;
  messageDetails?: unknown;
}

export interface AppraisalHistoryEntry {
  reviewId: string;
  cycleId: string;
  cycleName: string;
  cycleType: string;
  finalRating: number;
  ratingLabel: string;
  status: string;
  completedDate: string;
}

export interface AppraisalHistory {
  employeeId: string;
  employeeName: string;
  reviews: AppraisalHistoryEntry[];
  averageRating: number;
  performanceTrend: string;
}

export interface FeedbackEntry {
  feedbackId: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  feedbackType: FeedbackType;
  content: string;
  visibility: Visibility;
  relatedGoalId?: string;
  createdDateTime: string;
  acknowledged: boolean;
}

export interface PipObjective {
  objectiveId: string;
  description: string;
  targetDate: string;
  status: string;
  managerRemarks: string;
}

export interface PipRecord {
  pipId: string;
  site: string;
  reviewId: string;
  employeeId: string;
  reason: string;
  startDate: string;
  endDate: string;
  objectives: PipObjective[];
  reviewDates: string[];
  outcome: string;
  outcomeDate: string;
  status: string;
}

export interface RatingDistributionBucket {
  ratingValue: number;
  label: string;
  count: number;
  percentage: number;
  targetMinPercentage: number;
  targetMaxPercentage: number;
  withinTarget?: boolean;
}

export interface RatingDistribution {
  cycleId: string;
  department: string;
  totalEmployees: number;
  distribution: RatingDistributionBucket[];
  averageRating?: number;
}
