'use client';

import React from "react";
import { Button, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import GoalCardList from "../organisms/GoalCardList";
import GoalFormModal from "../organisms/GoalFormModal";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import { totalGoalWeight } from "../../utils/appraisalCalculations";
import styles from "../../styles/GoalSetting.module.css";

const GoalSettingTemplate: React.FC = () => {
  const {
    myGoals,
    loadingGoals,
    activeCycle,
    setGoalFormOpen,
    setGoalFormState,
    setSelectedGoal,
    deleteGoal,
    submitGoals,
  } = useHrmAppraisalStore();

  const weight = totalGoalWeight(myGoals);

  const handleEdit = (goal: import("../../types/domain.types").AppraisalGoal) => {
    setGoalFormState("EDIT");
    setSelectedGoal(goal);
    setGoalFormOpen(true);
  };

  const handleAddNew = () => {
    setGoalFormState("CREATE");
    setSelectedGoal(null);
    setGoalFormOpen(true);
  };

  return (
    <div className={styles.goalSettingRoot}>
      <div className={styles.goalHeader}>
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Cycle: {activeCycle?.cycleName}
          </Typography.Text>
          <div className={styles.weightCounter}>
            Total Weight: {weight}/100%
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
          Add Goal
        </Button>
      </div>

      <GoalCardList
        goals={myGoals}
        loading={loadingGoals}
        onEdit={handleEdit}
        onDelete={deleteGoal}
        onProgressUpdate={() => {}}
      />

      <div className={styles.submitBar}>
        <Button
          type="primary"
          disabled={weight !== 100}
          onClick={() => activeCycle && submitGoals(activeCycle.cycleId)}
        >
          Submit All Goals for Approval
        </Button>
      </div>

      <GoalFormModal />
    </div>
  );
};

export default GoalSettingTemplate;
