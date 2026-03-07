'use client';

import React from "react";
import { Alert, Empty, Spin } from "antd";
import GoalCard from "../molecules/GoalCard";
import type { AppraisalGoal } from "../../types/domain.types";
import { totalGoalWeight } from "../../utils/appraisalCalculations";
import styles from "../../styles/GoalSetting.module.css";

interface Props {
  goals: AppraisalGoal[];
  loading?: boolean;
  onEdit: (goal: AppraisalGoal) => void;
  onDelete: (goalId: string) => void;
  onProgressUpdate: (goalId: string, krId: string, value: number) => void;
}

const GoalCardList: React.FC<Props> = ({ goals, loading, onEdit, onDelete, onProgressUpdate }) => {
  const weight = totalGoalWeight(goals);
  const weightOk = weight === 100;

  if (loading) return <Spin style={{ display: "block", textAlign: "center", padding: 32 }} />;

  return (
    <div>
      {!weightOk && goals.length > 0 && (
        <Alert
          className={styles.weightWarning}
          type="warning"
          message={`Goals total ${weight}%. Must reach 100% before submitting for approval.`}
          showIcon
        />
      )}

      {goals.length === 0 && (
        <Empty description="No goals yet. Add your first goal." />
      )}

      {goals.map((goal) => (
        <GoalCard
          key={goal.goalId}
          goal={goal}
          isEditing={false}
          onEdit={() => onEdit(goal)}
          onDelete={() => onDelete(goal.goalId)}
          onProgressUpdate={onProgressUpdate}
        />
      ))}
    </div>
  );
};

export default GoalCardList;
