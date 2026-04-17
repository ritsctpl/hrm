// API request types for Performance Appraisal module

export interface ListCyclesRequest {
  organizationId: string;
  status?: string;
  cycleType?: string;
}

export interface CreateGoalRequest {
  organizationId: string;
  cycleId: string;
  employeeId: string;
  employeeName?: string;
  reportingManagerId?: string;
  goalTitle: string;
  goalDescription?: string;
  goalCategory: string;
  keyResults?: KeyResultRequest[];
  weightPercentage: number;
  priority?: string;
  startDate?: string;
  targetDate?: string;
  createdBy?: string;
}

export interface KeyResultRequest {
  description: string;
  targetValue?: number;
  unit?: string;
}

export interface SubmitSelfAssessmentRequest {
  organizationId: string;
  reviewId: string;
  employeeId: string;
  overallRating: number;
  overallComments: string;
  keyAccomplishments?: string;
  developmentGoals?: string;
  supportNeeded?: string;
  competencyRatings?: CompetencyRatingInput[];
}

export interface SubmitManagerAssessmentRequest {
  organizationId: string;
  reviewId: string;
  managerId: string;
  overallRating: number;
  overallComments: string;
  competencyRatings?: CompetencyRatingInput[];
  strengths?: string[];
  areasOfImprovement?: string[];
  recommendedRating?: number;
  promotionRecommendation?: boolean;
  promotionRecommendationReason?: string;
  compensationRecommendation?: string;
  developmentPlan?: string;
}

export interface GoalRatingInput {
  goalId: string;
  selfRating?: number;
  selfComments?: string;
  managerRating?: number;
  managerComments?: string;
}

export interface CompetencyRatingInput {
  competencyId?: string;
  competency?: string;
  rating: number;
  comments?: string;
}

export interface RateGoalRequest {
  organizationId: string;
  goalId: string;
  selfRating?: number;
  selfComments?: string;
  managerRating?: number;
  managerComments?: string;
  ratedBy: string;
}

export interface UpdateGoalProgressRequest {
  organizationId: string;
  goalId: string;
  updatedBy: string;
  currentValue: number;
  updateNote?: string;
  keyResultId?: string;
}

export interface CalibrateRatingRequest {
  organizationId: string;
  reviewId: string;
  calibratedRating: number;
  calibrationNotes: string;
  calibratedBy: string;
  calibrationJustification?: string;
}

export interface SignOffRequest {
  organizationId: string;
  reviewId: string;
  signingUserId: string;
  role: "EMPLOYEE" | "MANAGER" | "HR";
  disagrees?: boolean;
  disagreeComments?: string;
}

export interface RequestPeerFeedbackRequest {
  organizationId: string;
  reviewId: string;
  peerIds: string[];
  anonymous?: boolean;
  requestedBy: string;
}

export interface SubmitPeerFeedbackRequest {
  organizationId: string;
  reviewId: string;
  peerId: string;
  peerName?: string;
  relationship: string;
  ratings: { competencyId: string; rating: number; comments?: string }[];
  overallRating?: number;
  overallComments?: string;
  anonymous?: boolean;
}

export interface CreateCompetencyRequest {
  organizationId: string;
  name: string;
  category: string;
  description: string;
  weightPercentage: number;
  behavioralIndicators: { ratingValue: number; description: string }[];
  createdBy: string;
}

export interface UpdateCompetencyRequest {
  organizationId: string;
  name?: string;
  category?: string;
  description?: string;
  weightPercentage?: number;
  behavioralIndicators?: { ratingValue: number; description: string }[];
  updatedBy: string;
}

export interface BulkInitiateReviewsRequest {
  organizationId: string;
  cycleId: string;
  employeeIds: string[];
  initiatedBy: string;
}

export interface CreateCalibrationSessionRequest {
  organizationId: string;
  cycleId: string;
  department: string;
  scheduledDate: string;
  participants: string[];
  createdBy: string;
}

export interface CalibrationSession {
  sessionId: string;
  site: string;
  cycleId: string;
  department: string;
  scheduledDate: string;
  participants: string[];
  status: string;
  createdBy: string;
  createdAt: string;
}
