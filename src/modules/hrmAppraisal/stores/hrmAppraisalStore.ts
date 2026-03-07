'use client';

import { create } from "zustand";
import { parseCookies } from "nookies";
import { message } from "antd";
import { HrmAppraisalService } from "../services/hrmAppraisalService";
import type {
  AppraisalCycle,
  AppraisalGoal,
  AppraisalReview,
  FeedbackEntry,
  PipRecord,
  RatingDistribution,
} from "../types/domain.types";
import type {
  AppraisalScreenView,
  CalibrationFilters,
  GoalFormState,
} from "../types/ui.types";

interface HrmAppraisalState {
  cycles: AppraisalCycle[];
  activeCycle: AppraisalCycle | null;
  myGoals: AppraisalGoal[];
  myReview: AppraisalReview | null;
  teamReviews: AppraisalReview[];
  calibrationReviews: AppraisalReview[];
  ratingDistribution: RatingDistribution | null;
  myFeedback: FeedbackEntry[];
  activePip: PipRecord | null;

  currentView: AppraisalScreenView;
  selectedReview: AppraisalReview | null;
  selectedGoal: AppraisalGoal | null;
  goalFormOpen: boolean;
  goalFormState: GoalFormState;
  calibrationFilters: CalibrationFilters;
  activeTab: string;

  loadingCycles: boolean;
  loadingGoals: boolean;
  loadingReview: boolean;
  loadingTeamReviews: boolean;
  loadingCalibration: boolean;
  savingGoal: boolean;
  submittingAssessment: boolean;
  savingCalibration: boolean;

  error: string | null;

  fetchCycles: () => Promise<void>;
  fetchActiveCycle: () => Promise<void>;
  fetchMyGoals: (cycleId: string) => Promise<void>;
  fetchMyReview: (cycleId: string) => Promise<void>;
  fetchTeamReviews: (cycleId: string) => Promise<void>;
  fetchCalibrationReviews: (cycleId: string, department: string) => Promise<void>;
  fetchRatingDistribution: (cycleId: string, department: string) => Promise<void>;
  fetchMyFeedback: () => Promise<void>;

  createGoal: (payload: Omit<AppraisalGoal, "goalId">) => Promise<void>;
  updateGoal: (payload: AppraisalGoal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  submitGoals: (cycleId: string) => Promise<void>;

  submitSelfAssessment: (reviewId: string, data: unknown) => Promise<void>;
  submitManagerAssessment: (reviewId: string, data: unknown) => Promise<void>;
  submitPeerFeedback: (reviewId: string, data: unknown) => Promise<void>;

  calibrateRating: (reviewId: string, calibratedRating: number, notes: string) => Promise<void>;
  finalizeCalibration: (cycleId: string, department: string) => Promise<void>;

  setCurrentView: (view: AppraisalScreenView) => void;
  setSelectedReview: (review: AppraisalReview | null) => void;
  setSelectedGoal: (goal: AppraisalGoal | null) => void;
  setGoalFormOpen: (open: boolean) => void;
  setGoalFormState: (state: GoalFormState) => void;
  setActiveTab: (tab: string) => void;
  setCalibrationFilters: (filters: Partial<CalibrationFilters>) => void;
  clearError: () => void;
  reset: () => void;
}

const getSite = (): string => parseCookies()["site"] ?? "";
const getEmployee = (): string => parseCookies()["employeeId"] ?? "";

export const useHrmAppraisalStore = create<HrmAppraisalState>((set, get) => ({
  cycles: [],
  activeCycle: null,
  myGoals: [],
  myReview: null,
  teamReviews: [],
  calibrationReviews: [],
  ratingDistribution: null,
  myFeedback: [],
  activePip: null,

  currentView: "LANDING",
  selectedReview: null,
  selectedGoal: null,
  goalFormOpen: false,
  goalFormState: "CREATE",
  calibrationFilters: { department: "", cycleId: "" },
  activeTab: "my-appraisal",

  loadingCycles: false,
  loadingGoals: false,
  loadingReview: false,
  loadingTeamReviews: false,
  loadingCalibration: false,
  savingGoal: false,
  submittingAssessment: false,
  savingCalibration: false,

  error: null,

  fetchCycles: async () => {
    const site = getSite();
    set({ loadingCycles: true, error: null });
    try {
      const cycles = await HrmAppraisalService.listCycles(site);
      const active =
        cycles.find((c) =>
          ["GOAL_SETTING", "IN_PROGRESS", "CALIBRATION"].includes(c.status)
        ) ?? null;
      set({ cycles, activeCycle: active });
    } catch {
      set({ error: "Failed to load appraisal cycles" });
    } finally {
      set({ loadingCycles: false });
    }
  },

  fetchActiveCycle: async () => {
    const cycles = get().cycles;
    if (cycles.length === 0) await get().fetchCycles();
  },

  fetchMyGoals: async (cycleId) => {
    const site = getSite();
    const employeeId = getEmployee();
    set({ loadingGoals: true, error: null });
    try {
      const goals = await HrmAppraisalService.getEmployeeGoals(site, employeeId, cycleId);
      set({ myGoals: goals });
    } catch {
      set({ error: "Failed to load goals" });
    } finally {
      set({ loadingGoals: false });
    }
  },

  fetchMyReview: async (cycleId) => {
    const site = getSite();
    const employeeId = getEmployee();
    set({ loadingReview: true, error: null });
    try {
      const reviews = await HrmAppraisalService.getCycleReviews(site, cycleId, "");
      const mine = reviews.find((r) => r.employeeId === employeeId) ?? null;
      set({ myReview: mine });
    } catch {
      set({ error: "Failed to load review" });
    } finally {
      set({ loadingReview: false });
    }
  },

  fetchTeamReviews: async (cycleId) => {
    const site = getSite();
    const managerId = getEmployee();
    set({ loadingTeamReviews: true, error: null });
    try {
      const reviews = await HrmAppraisalService.getTeamReviews(site, managerId, cycleId);
      set({ teamReviews: reviews });
    } catch {
      set({ error: "Failed to load team reviews" });
    } finally {
      set({ loadingTeamReviews: false });
    }
  },

  fetchCalibrationReviews: async (cycleId, department) => {
    const site = getSite();
    set({ loadingCalibration: true, error: null });
    try {
      const reviews = await HrmAppraisalService.getCycleReviews(site, cycleId, department);
      set({ calibrationReviews: reviews });
    } catch {
      set({ error: "Failed to load calibration data" });
    } finally {
      set({ loadingCalibration: false });
    }
  },

  fetchRatingDistribution: async (cycleId, department) => {
    const site = getSite();
    try {
      const dist = await HrmAppraisalService.getRatingDistribution(site, cycleId, department);
      set({ ratingDistribution: dist });
    } catch {
      set({ error: "Failed to load rating distribution" });
    }
  },

  fetchMyFeedback: async () => {
    const site = getSite();
    const employeeId = getEmployee();
    try {
      const feedback = await HrmAppraisalService.getReceivedFeedback(site, employeeId);
      set({ myFeedback: feedback });
    } catch {
      set({ error: "Failed to load feedback" });
    }
  },

  createGoal: async (payload) => {
    const site = getSite();
    set({ savingGoal: true, error: null });
    try {
      await HrmAppraisalService.createGoal({
        ...(payload as AppraisalGoal),
        site,
        createdBy: getEmployee(),
      } as unknown as import("../types/api.types").CreateGoalRequest);
      message.success("Goal created");
      set({ goalFormOpen: false });
      await get().fetchMyGoals(payload.cycleId);
    } catch {
      message.error("Failed to create goal");
    } finally {
      set({ savingGoal: false });
    }
  },

  updateGoal: async (payload) => {
    const site = getSite();
    set({ savingGoal: true, error: null });
    try {
      await HrmAppraisalService.updateGoal({ ...payload, site } as unknown as AppraisalGoal);
      message.success("Goal updated");
      set({ goalFormOpen: false });
      await get().fetchMyGoals(payload.cycleId);
    } catch {
      message.error("Failed to update goal");
    } finally {
      set({ savingGoal: false });
    }
  },

  deleteGoal: async (goalId) => {
    const site = getSite();
    const employeeId = getEmployee();
    try {
      await HrmAppraisalService.deleteGoal(site, goalId, employeeId);
      message.success("Goal deleted");
      const cycle = get().activeCycle;
      if (cycle) await get().fetchMyGoals(cycle.cycleId);
    } catch {
      message.error("Failed to delete goal");
    }
  },

  submitGoals: async (cycleId) => {
    const site = getSite();
    const employeeId = getEmployee();
    try {
      await HrmAppraisalService.submitGoals(site, employeeId, cycleId, employeeId);
      message.success("Goals submitted for approval");
      await get().fetchMyGoals(cycleId);
    } catch {
      message.error("Failed to submit goals");
    }
  },

  submitSelfAssessment: async (reviewId, data) => {
    set({ submittingAssessment: true });
    try {
      await HrmAppraisalService.submitSelfAssessment(
        reviewId,
        data as Omit<import("../types/api.types").SubmitSelfAssessmentRequest, "reviewId">
      );
      message.success("Self assessment submitted");
      const cycle = get().activeCycle;
      if (cycle) await get().fetchMyReview(cycle.cycleId);
    } catch {
      message.error("Failed to submit self assessment");
    } finally {
      set({ submittingAssessment: false });
    }
  },

  submitManagerAssessment: async (reviewId, data) => {
    set({ submittingAssessment: true });
    try {
      await HrmAppraisalService.submitManagerAssessment(
        reviewId,
        data as Omit<import("../types/api.types").SubmitManagerAssessmentRequest, "reviewId">
      );
      message.success("Manager assessment submitted");
      const cycle = get().activeCycle;
      if (cycle) await get().fetchTeamReviews(cycle.cycleId);
    } catch {
      message.error("Failed to submit manager assessment");
    } finally {
      set({ submittingAssessment: false });
    }
  },

  submitPeerFeedback: async (reviewId, data) => {
    try {
      await HrmAppraisalService.submitPeerFeedback(reviewId, data);
      message.success("Peer feedback submitted");
    } catch {
      message.error("Failed to submit peer feedback");
    }
  },

  calibrateRating: async (reviewId, calibratedRating, notes) => {
    const site = getSite();
    const calibratedBy = getEmployee();
    set({ savingCalibration: true });
    try {
      await HrmAppraisalService.calibrateRating({
        site,
        reviewId,
        calibratedRating,
        notes,
        calibratedBy,
      });
      message.success("Calibration saved");
      const { cycleId, department } = get().calibrationFilters;
      await get().fetchCalibrationReviews(cycleId, department);
    } catch {
      message.error("Failed to save calibration");
    } finally {
      set({ savingCalibration: false });
    }
  },

  finalizeCalibration: async (cycleId, department) => {
    message.success(`Calibration finalized for ${department}`);
  },

  setCurrentView: (view) => set({ currentView: view }),
  setSelectedReview: (review) => set({ selectedReview: review }),
  setSelectedGoal: (goal) => set({ selectedGoal: goal }),
  setGoalFormOpen: (open) => set({ goalFormOpen: open }),
  setGoalFormState: (state) => set({ goalFormState: state }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCalibrationFilters: (filters) =>
    set((state) => ({
      calibrationFilters: { ...state.calibrationFilters, ...filters },
    })),
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      cycles: [],
      activeCycle: null,
      myGoals: [],
      myReview: null,
      teamReviews: [],
      calibrationReviews: [],
      myFeedback: [],
      error: null,
      currentView: "LANDING",
    }),
}));
