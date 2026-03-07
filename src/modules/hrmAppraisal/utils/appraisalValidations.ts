import type { AppraisalGoal } from "../types/domain.types";
import { totalGoalWeight } from "./appraisalCalculations";

export function validateGoalWeights(goals: AppraisalGoal[]): { valid: boolean; message: string } {
  const total = totalGoalWeight(goals);
  if (total !== 100) {
    return {
      valid: false,
      message: `Goals total ${total}%. Must reach exactly 100% before submitting for approval.`,
    };
  }
  return { valid: true, message: "" };
}

export function validatePhaseGate(
  currentPhase: string,
  requiredPreviousPhase: string,
  previousPhaseCompleted: boolean
): { valid: boolean; message: string } {
  if (!previousPhaseCompleted) {
    return {
      valid: false,
      message: `${requiredPreviousPhase} must be completed before starting ${currentPhase}.`,
    };
  }
  return { valid: true, message: "" };
}
