import type { AppraisalGoal, CompetencyRating } from "../types/domain.types";

export function calculateWeightedGoalScore(goals: AppraisalGoal[]): number {
  if (goals.length === 0) return 0;
  const totalWeight = goals.reduce((sum, g) => sum + g.weightPercentage, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = goals.reduce(
    (sum, g) => sum + (g.selfRating || 0) * (g.weightPercentage / 100),
    0
  );
  return Math.round(weightedSum * 100) / 100;
}

export function calculateWeightedCompetencyScore(ratings: CompetencyRating[]): number {
  if (ratings.length === 0) return 0;
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return Math.round(avg * 100) / 100;
}

export function calculateFinalScore(
  goalScore: number,
  competencyScore: number,
  goalWeight: number,
  competencyWeight: number
): number {
  const score =
    goalScore * (goalWeight / 100) + competencyScore * (competencyWeight / 100);
  return Math.round(score * 100) / 100;
}

export function totalGoalWeight(goals: AppraisalGoal[]): number {
  return goals.reduce((sum, g) => sum + g.weightPercentage, 0);
}
