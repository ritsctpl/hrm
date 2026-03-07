'use client';

import { useHrmAppraisalStore } from "../stores/hrmAppraisalStore";
import { totalGoalWeight } from "../utils/appraisalCalculations";

export function useAppraisalGoals() {
  const {
    myGoals,
    loadingGoals,
    savingGoal,
    goalFormOpen,
    goalFormState,
    selectedGoal,
    fetchMyGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    submitGoals,
    setGoalFormOpen,
    setGoalFormState,
    setSelectedGoal,
  } = useHrmAppraisalStore();

  const weightTotal = totalGoalWeight(myGoals);
  const canSubmit = weightTotal === 100;

  return {
    myGoals,
    loadingGoals,
    savingGoal,
    goalFormOpen,
    goalFormState,
    selectedGoal,
    weightTotal,
    canSubmit,
    fetchMyGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    submitGoals,
    setGoalFormOpen,
    setGoalFormState,
    setSelectedGoal,
  };
}
