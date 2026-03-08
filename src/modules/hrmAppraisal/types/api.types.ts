// API request types for Performance Appraisal module

export interface ListCyclesRequest {
  site: string;
  status?: string;
  cycleType?: string;
}

export interface CreateGoalRequest {
  site: string;
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
  site: string;
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
  site: string;
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
  site: string;
  goalId: string;
  selfRating?: number;
  selfComments?: string;
  managerRating?: number;
  managerComments?: string;
  ratedBy: string;
}

export interface UpdateGoalProgressRequest {
  site: string;
  goalId: string;
  updatedBy: string;
  currentValue: number;
  updateNote?: string;
  keyResultId?: string;
}

export interface CalibrateRatingRequest {
  site: string;
  reviewId: string;
  calibratedRating: number;
  calibrationNotes: string;
  calibratedBy: string;
  calibrationJustification?: string;
}

export interface SignOffRequest {
  site: string;
  reviewId: string;
  signingUserId: string;
  role: "EMPLOYEE" | "MANAGER" | "HR";
  disagrees?: boolean;
  disagreeComments?: string;
}

export interface RequestPeerFeedbackRequest {
  site: string;
  reviewId: string;
  peerIds: string[];
  anonymous?: boolean;
  requestedBy: string;
}

export interface SubmitPeerFeedbackRequest {
  site: string;
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
  site: string;
  name: string;
  category: string;
  description: string;
  weightPercentage: number;
  behavioralIndicators: { ratingValue: number; description: string }[];
  createdBy: string;
}

export interface UpdateCompetencyRequest {
  site: string;
  name?: string;
  category?: string;
  description?: string;
  weightPercentage?: number;
  behavioralIndicators?: { ratingValue: number; description: string }[];
  updatedBy: string;
}

export interface BulkInitiateReviewsRequest {
  site: string;
  cycleId: string;
  employeeIds: string[];
  initiatedBy: string;
}

export interface CreateCalibrationSessionRequest {
  site: string;
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
