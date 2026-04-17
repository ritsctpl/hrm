import api from "@/services/api";
import type {
  AppraisalCycle,
  AppraisalGoal,
  AppraisalReview,
  AppraisalHistory,
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
  SignOffRequest,
  RateGoalRequest,
  UpdateGoalProgressRequest,
  SubmitPeerFeedbackRequest,
  CreateCompetencyRequest,
  UpdateCompetencyRequest,
  BulkInitiateReviewsRequest,
  CreateCalibrationSessionRequest,
  CalibrationSession,
} from "../types/api.types";

export class HrmAppraisalService {
  private static readonly BASE = "/hrm-service/appraisal";

  // ── Cycles ──

  static async listCycles(organizationId: string, status?: string, cycleType?: string): Promise<AppraisalCycle[]> {
    const res = await api.post<AppraisalCycle[]>(`${this.BASE}/listCycles`, { organizationId, status, cycleType });
    return res.data ?? [];
  }

  static async getCycle(organizationId: string, cycleId: string): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/getCycle`, { organizationId, cycleId });
    return res.data;
  }

  static async createCycle(request: Partial<AppraisalCycle> & { createdBy: string }): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/createCycle`, request);
    return res.data;
  }

  static async updateCycle(request: Partial<AppraisalCycle> & { createdBy?: string }): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/updateCycle`, request);
    return res.data;
  }

  static async activatePhase(
    organizationId: string,
    cycleId: string,
    phaseId: string,
    updatedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/activatePhase`, {
      organizationId,
      cycleId,
      phaseId,
      updatedBy,
    });
    return res.data;
  }

  static async closePhase(
    organizationId: string,
    cycleId: string,
    phaseId: string,
    updatedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/closePhase`, {
      organizationId,
      cycleId,
      phaseId,
      updatedBy,
    });
    return res.data;
  }

  static async closeCycle(
    organizationId: string,
    cycleId: string,
    closedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/closeCycle`, {
      organizationId,
      cycleId,
      closedBy,
    });
    return res.data;
  }

  static async archiveCycle(
    organizationId: string,
    cycleId: string,
    archivedBy: string
  ): Promise<AppraisalCycle> {
    const res = await api.post<AppraisalCycle>(`${this.BASE}/archiveCycle`, {
      organizationId,
      cycleId,
      archivedBy,
    });
    return res.data;
  }

  // ── Goals ──

  static async createGoal(request: CreateGoalRequest): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/createGoal`, request);
    return res.data;
  }

  static async updateGoal(request: Partial<AppraisalGoal> & { organizationId: string }): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/updateGoal`, request);
    return res.data;
  }

  static async getGoal(organizationId: string, goalId: string): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/getGoal`, { organizationId, goalId });
    return res.data;
  }

  static async deleteGoal(organizationId: string, goalId: string, deletedBy: string): Promise<void> {
    await api.post(`${this.BASE}/deleteGoal`, { organizationId, goalId, deletedBy });
  }

  static async getEmployeeGoals(
    organizationId: string,
    employeeId: string,
    cycleId: string
  ): Promise<AppraisalGoal[]> {
    const res = await api.post<AppraisalGoal[]>(`${this.BASE}/getEmployeeGoals`, {
      organizationId,
      employeeId,
      cycleId,
    });
    return res.data ?? [];
  }

  static async getTeamGoals(
    organizationId: string,
    managerId: string,
    cycleId: string
  ): Promise<AppraisalGoal[]> {
    const res = await api.post<AppraisalGoal[]>(`${this.BASE}/getTeamGoals`, {
      organizationId,
      managerId,
      cycleId,
    });
    return res.data ?? [];
  }

  static async submitGoals(
    organizationId: string,
    employeeId: string,
    cycleId: string,
    submittedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/submitGoals`, { organizationId, employeeId, cycleId, submittedBy });
  }

  static async approveGoals(
    organizationId: string,
    employeeId: string,
    cycleId: string,
    approvedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/approveGoals`, { organizationId, employeeId, cycleId, approvedBy });
  }

  static async updateGoalProgress(request: UpdateGoalProgressRequest): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/updateGoalProgress`, request);
    return res.data;
  }

  static async rateGoal(request: RateGoalRequest): Promise<AppraisalGoal> {
    const res = await api.post<AppraisalGoal>(`${this.BASE}/rateGoal`, request);
    return res.data;
  }

  // ── Reviews ──

  static async initiateReview(request: Partial<AppraisalReview> & { organizationId: string; initiatedBy: string }): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/initiateReview`, request);
    return res.data;
  }

  static async getReview(organizationId: string, reviewId: string): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/getReview`, { organizationId, reviewId });
    return res.data;
  }

  static async getTeamReviews(
    organizationId: string,
    managerId: string,
    cycleId: string
  ): Promise<AppraisalReview[]> {
    const res = await api.post<AppraisalReview[]>(`${this.BASE}/getTeamReviews`, {
      organizationId,
      managerId,
      cycleId,
    });
    return res.data ?? [];
  }

  static async getCycleReviews(
    organizationId: string,
    cycleId: string,
    department?: string
  ): Promise<AppraisalReview[]> {
    const res = await api.post<AppraisalReview[]>(`${this.BASE}/getCycleReviews`, {
      organizationId,
      cycleId,
      department,
    });
    return res.data ?? [];
  }

  static async submitSelfAssessment(request: SubmitSelfAssessmentRequest): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/submitSelfAssessment`, request);
    return res.data;
  }

  static async submitManagerAssessment(request: SubmitManagerAssessmentRequest): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/submitManagerAssessment`, request);
    return res.data;
  }

  static async requestPeerFeedback(
    organizationId: string,
    reviewId: string,
    peerIds: string[],
    anonymous: boolean,
    requestedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/requestPeerFeedback`, {
      organizationId,
      reviewId,
      peerIds,
      anonymous,
      requestedBy,
    });
  }

  static async submitPeerFeedback(request: SubmitPeerFeedbackRequest): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/submitPeerFeedback`, request);
    return res.data;
  }

  static async calibrateRating(request: CalibrateRatingRequest): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/calibrateRating`, request);
    return res.data;
  }

  static async signOff(request: SignOffRequest): Promise<AppraisalReview> {
    const res = await api.post<AppraisalReview>(`${this.BASE}/signOff`, request);
    return res.data;
  }

  static async getAppraisalHistory(
    organizationId: string,
    employeeId: string
  ): Promise<AppraisalHistory> {
    const res = await api.post<AppraisalHistory>(`${this.BASE}/getAppraisalHistory`, {
      organizationId,
      employeeId,
    });
    return res.data;
  }

  static async getRatingDistribution(
    organizationId: string,
    cycleId: string,
    department?: string
  ): Promise<RatingDistribution> {
    const res = await api.post<RatingDistribution>(`${this.BASE}/getRatingDistribution`, {
      organizationId,
      cycleId,
      department,
    });
    return res.data;
  }

  // ── Feedback ──

  static async createFeedback(request: Partial<FeedbackEntry>): Promise<FeedbackEntry> {
    const res = await api.post<FeedbackEntry>(`${this.BASE}/createFeedback`, request);
    return res.data;
  }

  static async getReceivedFeedback(
    organizationId: string,
    employeeId: string
  ): Promise<FeedbackEntry[]> {
    const res = await api.post<FeedbackEntry[]>(`${this.BASE}/getReceivedFeedback`, {
      organizationId,
      employeeId,
    });
    return res.data ?? [];
  }

  static async getGivenFeedback(
    organizationId: string,
    employeeId: string
  ): Promise<FeedbackEntry[]> {
    const res = await api.post<FeedbackEntry[]>(`${this.BASE}/getGivenFeedback`, {
      organizationId,
      employeeId,
    });
    return res.data ?? [];
  }

  static async acknowledgeFeedback(
    organizationId: string,
    feedbackId: string,
    employeeId: string
  ): Promise<void> {
    await api.post(`${this.BASE}/acknowledgeFeedback`, { organizationId, feedbackId, employeeId });
  }

  static async deleteFeedback(
    organizationId: string,
    feedbackId: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/deleteFeedback`, { organizationId, feedbackId, deletedBy });
  }

  // ── PIP ──

  static async initiatePip(request: Partial<PipRecord>): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/initiatePip`, request);
    return res.data;
  }

  static async getPip(organizationId: string, pipId: string): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/getPip`, { organizationId, pipId });
    return res.data;
  }

  static async updatePipProgress(request: Partial<PipRecord>): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/updatePipProgress`, request);
    return res.data;
  }

  static async closePip(
    organizationId: string,
    pipId: string,
    outcome: string,
    outcomeNotes: string,
    closedBy: string
  ): Promise<PipRecord> {
    const res = await api.post<PipRecord>(`${this.BASE}/closePip`, {
      organizationId,
      pipId,
      outcome,
      outcomeNotes,
      closedBy,
    });
    return res.data;
  }

  static async getActivePips(organizationId: string): Promise<PipRecord[]> {
    const res = await api.post<PipRecord[]>(`${this.BASE}/getActivePips`, { organizationId });
    return res.data ?? [];
  }

  static async getEmployeePips(
    organizationId: string,
    employeeId: string
  ): Promise<PipRecord[]> {
    const res = await api.post<PipRecord[]>(`${this.BASE}/getEmployeePips`, {
      organizationId,
      employeeId,
    });
    return res.data ?? [];
  }

  // ── Competencies ──

  static async createCompetency(
    payload: CreateCompetencyRequest
  ): Promise<CompetencyDefinition> {
    const res = await api.post<CompetencyDefinition>(`${this.BASE}/competency/create`, payload);
    return res.data;
  }

  static async getCompetency(organizationId: string, handle: string): Promise<CompetencyDefinition> {
    const res = await api.post<CompetencyDefinition>(`${this.BASE}/competency/retrieve`, { organizationId, handle });
    return res.data;
  }

  static async listCompetencies(organizationId: string): Promise<CompetencyDefinition[]> {
    const res = await api.post<CompetencyDefinition[]>(`${this.BASE}/competency/list`, { organizationId });
    return res.data ?? [];
  }

  static async updateCompetency(
    handle: string,
    payload: UpdateCompetencyRequest
  ): Promise<CompetencyDefinition> {
    const res = await api.post<CompetencyDefinition>(`${this.BASE}/competency/update`, {
      handle,
      ...payload,
    });
    return res.data;
  }

  static async deleteCompetency(
    organizationId: string,
    handle: string,
    deletedBy: string
  ): Promise<void> {
    await api.post(`${this.BASE}/competency/delete`, { organizationId, handle, deletedBy });
  }

  // ── Bulk / Export / Calibration Sessions ──

  static async bulkInitiateReviews(
    payload: BulkInitiateReviewsRequest
  ): Promise<AppraisalReview[]> {
    const res = await api.post<AppraisalReview[]>(`${this.BASE}/bulkInitiateReview`, payload);
    return res.data ?? [];
  }

  static async exportReviews(
    organizationId: string,
    cycleId: string,
    format?: string
  ): Promise<Blob> {
    const res = await api.post(`${this.BASE}/export`, { organizationId, cycleId, format }, {
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
    organizationId: string,
    sessionId: string
  ): Promise<CalibrationSession> {
    const res = await api.post<CalibrationSession>(`${this.BASE}/getCalibrationSession`, {
      organizationId,
      sessionId,
    });
    return res.data;
  }
}

export default HrmAppraisalService;
