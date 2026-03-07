import api from "@/services/api";
import type {
  AppraisalCycle,
  AppraisalGoal,
  AppraisalReview,
  FeedbackEntry,
  RatingDistribution,
  PipRecord,
  CompetencyDefinition,
} from "../types/domain.types";
import type {
  CreateGoalRequest,
  SubmitSelfAssessmentRequest,
  SubmitManagerAssessmentRequest,
  CalibrateRatingRequest,
  CreateCompetencyRequest,
  UpdateCompetencyRequest,
  BulkInitiateReviewsRequest,
  CreateCalibrationSessionRequest,
  CalibrationSession,
} from "../types/api.types";

export class HrmAppraisalService {
  private static readonly BASE = "/hrm-service/appraisal";

  static async listCycles(site: string, status?: string): Promise<AppraisalCycle[]> {
    const res = await api.post<AppraisalCycle[]>(`${this.BASE}/listCycles`, { site, status });
    return res.data ?? [];
  }

  static async getCycle(site: string, cycleId: string): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/getCycle`, { site, cycleId });
    return res.data;
  }

  static async createCycle(request: Partial<AppraisalCycle>): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/createCycle`, request);
    return res.data;
  }

  static async updateCycle(request: Partial<AppraisalCycle>): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/updateCycle`, request);
    return res.data;
  }

  static async activatePhase(
    site: string,
    cycleId: string,
    phaseId: string,
    updatedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/activatePhase`, {
      site,
      cycleId,
      phaseId,
      updatedBy,
    });
    return res.data;
  }

  static async closePhase(
    site: string,
    cycleId: string,
    phaseId: string,
    updatedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/closePhase`, {
      site,
      cycleId,
      phaseId,
      updatedBy,
    });
    return res.data;
  }

  static async createGoal(request: CreateGoalRequest): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/createGoal`, request);
    return res.data;
  }

  static async updateGoal(request: Partial<AppraisalGoal>): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/updateGoal`, request);
    return res.data;
  }

  static async deleteGoal(site: string, goalId: string, deletedBy: string): Promise<void> {
    await api.post(`${this.BASE}/deleteGoal`, { site, goalId, deletedBy });
  }

  static async getEmployeeGoals(
    site: string,
    employeeId: string,
    cycleId: string
  ): Promise<AppraisalGoal[]> {
    const res = await api.post<AppraisalGoal[]>(`${this.BASE}/getEmployeeGoals`, {
      site,
      employeeId,
      cycleId,
    });
    return res.data ?? [];
  }

  static async getTeamGoals(
    site: string,
    managerId: string,
    cycleId: string
  ): Promise<AppraisalGoal[]> {
    const res = await api.post<AppraisalGoal[]>(`${this.BASE}/getTeamGoals`, {
      site,
      managerId,
      cycleId,
    });
    return res.data ?? [];
  }

  static async submitGoals(
    site: string,
    employeeId: string,
    cycleId: string,
    submittedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/submitGoals`, { site, employeeId, cycleId, submittedBy });
  }

  static async approveGoals(
    site: string,
    employeeId: string,
    cycleId: string,
    approvedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/approveGoals`, { site, employeeId, cycleId, approvedBy });
  }

  static async updateGoalProgress(request: Partial<AppraisalGoal>): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/updateGoalProgress`, request);
    return res.data;
  }

  static async initiateReview(request: Partial<AppraisalReview>): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/initiateReview`, request);
    return res.data;
  }

  static async getReview(site: string, reviewId: string): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/getReview`, { site, reviewId });
    return res.data;
  }

  static async getTeamReviews(
    site: string,
    managerId: string,
    cycleId: string
  ): Promise<AppraisalReview[]> {
    const res = await api.post<AppraisalReview[]>(`${this.BASE}/getTeamReviews`, {
      site,
      managerId,
      cycleId,
    });
    return res.data ?? [];
  }

  static async getCycleReviews(
    site: string,
    cycleId: string,
    department: string
  ): Promise<AppraisalReview[]> {
    const res = await api.post<AppraisalReview[]>(`${this.BASE}/getCycleReviews`, {
      site,
      cycleId,
      department,
    });
    return res.data ?? [];
  }

  static async submitSelfAssessment(
    reviewId: string,
    data: Omit<SubmitSelfAssessmentRequest, "reviewId">
  ): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/submitSelfAssessment`, {
      reviewId,
      ...data,
    });
    return res.data;
  }

  static async submitManagerAssessment(
    reviewId: string,
    data: Omit<SubmitManagerAssessmentRequest, "reviewId">
  ): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/submitManagerAssessment`, {
      reviewId,
      ...data,
    });
    return res.data;
  }

  static async requestPeerFeedback(
    site: string,
    reviewId: string,
    peerIds: string[],
    anonymous: boolean,
    requestedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/requestPeerFeedback`, {
      site,
      reviewId,
      peerIds,
      anonymous,
      requestedBy,
    });
  }

  static async submitPeerFeedback(
    reviewId: string,
    data: unknown
  ): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/submitPeerFeedback`, {
      reviewId,
      ...(data as object),
    });
    return res.data;
  }

  static async calibrateRating(request: CalibrateRatingRequest): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/calibrateRating`, request);
    return res.data;
  }

  static async signOff(request: Partial<AppraisalReview>): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/signOff`, request);
    return res.data;
  }

  static async getRatingDistribution(
    site: string,
    cycleId: string,
    department: string
  ): Promise<RatingDistribution> {
    const res = await api.post<RatingDistribution>(`${this.BASE}/getRatingDistribution`, {
      site,
      cycleId,
      department,
    });
    return res.data;
  }

  static async getAppraisalHistory(
    site: string,
    employeeId: string
  ): Promise<AppraisalReview[]> {
    const res = await api.post<AppraisalReview[]>(`${this.BASE}/getAppraisalHistory`, {
      site,
      employeeId,
    });
    return res.data ?? [];
  }

  static async createFeedback(request: Partial<FeedbackEntry>): Promise<FeedbackEntry> {
    const res = await api.post<FeedbackEntry>(`${this.BASE}/createFeedback`, request);
    return res.data;
  }

  static async getReceivedFeedback(
    site: string,
    employeeId: string
  ): Promise<FeedbackEntry[]> {
    const res = await api.post<FeedbackEntry[]>(`${this.BASE}/getReceivedFeedback`, {
      site,
      employeeId,
    });
    return res.data ?? [];
  }

  static async getGivenFeedback(
    site: string,
    employeeId: string
  ): Promise<FeedbackEntry[]> {
    const res = await api.post<FeedbackEntry[]>(`${this.BASE}/getGivenFeedback`, {
      site,
      employeeId,
    });
    return res.data ?? [];
  }

  static async acknowledgeFeedback(
    site: string,
    feedbackId: string,
    employeeId: string
  ): Promise<void> {
    await api.post(`${this.BASE}/acknowledgeFeedback`, { site, feedbackId, employeeId });
  }

  static async initiatePip(request: Partial<PipRecord>): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/initiatePip`, request);
    return res.data;
  }

  static async getPip(site: string, pipId: string): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/getPip`, { site, pipId });
    return res.data;
  }

  static async updatePipProgress(request: Partial<PipRecord>): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/updatePipProgress`, request);
    return res.data;
  }

  static async closePip(
    site: string,
    pipId: string,
    outcome: string,
    notes: string,
    closedBy: string
  ): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/closePip`, {
      site,
      pipId,
      outcome,
      outcomeNotes: notes,
      closedBy,
    });
    return res.data;
  }

  static async getActivePips(site: string): Promise<PipRecord[]> {
    const res = await api.post<PipRecord[]>(`${this.BASE}/getActivePips`, { site });
    return res.data ?? [];
  }

  static async closeCycle(
    site: string,
    cycleId: string,
    closedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/closeCycle`, {
      site,
      cycleId,
      closedBy,
    });
    return res.data;
  }

  static async archiveCycle(
    site: string,
    cycleId: string,
    archivedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/archiveCycle`, {
      site,
      cycleId,
      archivedBy,
    });
    return res.data;
  }

  static async createCompetency(
    payload: CreateCompetencyRequest
  ): Promise<CompetencyDefinition> {
    const res = await api.post<CompetencyDefinition>(`${this.BASE}/createCompetency`, payload);
    return res.data;
  }

  static async listCompetencies(site: string): Promise<CompetencyDefinition[]> {
    const res = await api.post<CompetencyDefinition[]>(`${this.BASE}/listCompetencies`, { site });
    return res.data ?? [];
  }

  static async updateCompetency(
    handle: string,
    payload: UpdateCompetencyRequest
  ): Promise<CompetencyDefinition> {
    const res = await api.post<CompetencyDefinition>(`${this.BASE}/updateCompetency`, {
      handle,
      ...payload,
    });
    return res.data;
  }

  static async deleteCompetency(
    site: string,
    handle: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/deleteCompetency`, { site, handle, deletedBy });
  }

  static async deleteFeedback(
    site: string,
    feedbackId: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/deleteFeedback`, { site, feedbackId, deletedBy });
  }

  static async bulkInitiateReviews(
    payload: BulkInitiateReviewsRequest
  ): Promise<AppraisalReview[]> {
    const res = await api.post<AppraisalReview[]>(`${this.BASE}/bulkInitiateReviews`, payload);
    return res.data ?? [];
  }

  static async exportReviews(
    site: string,
    cycleId: string,
    format: string
  ): Promise<Blob> {
    const res = await api.post(`${this.BASE}/exportReviews`, { site, cycleId, format }, {
      responseType: "blob",
    });
    return res.data as Blob;
  }

  static async createCalibrationSession(
    payload: CreateCalibrationSessionRequest
  ): Promise<CalibrationSession> {
    const res = await api.post<CalibrationSession>(
      `${this.BASE}/createCalibrationSession`,
      payload
    );
    return res.data;
  }

  static async getCalibrationSession(
    site: string,
    sessionId: string
  ): Promise<CalibrationSession> {
    const res = await api.post<CalibrationSession>(`${this.BASE}/getCalibrationSession`, {
      site,
      sessionId,
    });
    return res.data;
  }

  static async getEmployeePips(
    site: string,
    employeeId: string
  ): Promise<PipRecord[]> {
    const res = await api.post<PipRecord[]>(`${this.BASE}/getEmployeePips`, {
      site,
      employeeId,
    });
    return res.data ?? [];
  }
}

export default HrmAppraisalService;
