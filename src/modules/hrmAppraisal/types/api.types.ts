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
  goalTitle: string;
  goalDescription: string;
  goalCategory: string;
  keyResults: KeyResultRequest[];
  weightPercentage: number;
  priority: string;
  startDate: string;
  targetDate: string;
  createdBy: string;
}

export interface KeyResultRequest {
  description: string;
  targetValue: number;
  unit: string;
}

export interface SubmitSelfAssessmentRequest {
  site: string;
  reviewId: string;
  overallComments: string;
  goalRatings: GoalRatingInput[];
  competencyRatings: CompetencyRatingInput[];
  submittedBy: string;
}

export interface SubmitManagerAssessmentRequest {
  site: string;
  reviewId: string;
  goalRatings: GoalRatingInput[];
  competencyRatings: CompetencyRatingInput[];
  overallComments: string;
  strengths: string[];
  areasOfImprovement: string[];
  recommendedRating: number;
  promotionRecommendation: boolean;
  compensationRecommendation: string;
  submittedBy: string;
}

export interface GoalRatingInput {
  goalId: string;
  selfRating?: number;
  selfComments?: string;
  managerRating?: number;
  managerComments?: string;
}

export interface CompetencyRatingInput {
  competencyId: string;
  rating: number;
  comments: string;
}

export interface CalibrateRatingRequest {
  site: string;
  reviewId: string;
  calibratedRating: number;
  notes: string;
  calibratedBy: string;
}

export interface RequestPeerFeedbackRequest {
  site: string;
  reviewId: string;
  peerIds: string[];
  anonymous: boolean;
  requestedBy: string;
}
