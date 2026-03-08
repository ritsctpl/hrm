import type { GoalCategory, PhaseType } from "../types/domain.types";

export const RATING_LABELS: Record<number, string> = {
  1: "Unsatisfactory",
  2: "Needs Improvement",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Exceptional",
};

export const RATING_COLORS: Record<number, string> = {
  1: "#f5222d",
  2: "#fa8c16",
  3: "#1890ff",
  4: "#52c41a",
  5: "#722ed1",
};

export const GOAL_CATEGORY_COLORS: Record<GoalCategory, string> = {
  BUSINESS: "blue",
  DEVELOPMENT: "green",
  STRETCH: "purple",
  LEARNING: "cyan",
};

export const PHASE_ORDER: PhaseType[] = [
  "GOAL_SETTING",
  "SELF_ASSESSMENT",
  "MANAGER_ASSESSMENT",
  "MANAGER_REVIEW",
  "PEER_FEEDBACK",
  "CALIBRATION",
  "SIGN_OFF",
];

export const PHASE_LABELS: Record<PhaseType, string> = {
  GOAL_SETTING: "Goal Setting",
  SELF_ASSESSMENT: "Self Assessment",
  MANAGER_ASSESSMENT: "Manager Assessment",
  MANAGER_REVIEW: "Manager Review",
  PEER_FEEDBACK: "Peer Feedback",
  CALIBRATION: "Calibration",
  SIGN_OFF: "Sign Off",
};

export const REVIEW_STATUS_COLORS: Record<string, string> = {
  PENDING_SELF: "orange",
  PENDING_MANAGER: "blue",
  PENDING_CALIBRATION: "purple",
  PENDING_SIGN_OFF: "cyan",
  COMPLETED: "green",
};
