'use client';

import React from "react";
import { Button, Card, Progress, Space, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import GoalStatusTag from "../atoms/GoalStatusTag";
import type { GoalCardProps } from "../../types/ui.types";
import { GOAL_CATEGORY_COLORS } from "../../utils/appraisalConstants";
import styles from "../../styles/GoalSetting.module.css";

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => (
  <Card
    className={styles.goalCard}
    size="small"
    extra={
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={onEdit}>
          Edit
        </Button>
        <Button size="small" icon={<DeleteOutlined />} danger onClick={onDelete} />
      </Space>
    }
    title={
      <div className={styles.goalCardHeader}>
        <span>
          <Tag color={GOAL_CATEGORY_COLORS[goal.goalCategory] ?? "default"}>
            {goal.goalCategory}
          </Tag>
          {goal.goalTitle}
        </span>
      </div>
    }
  >
    <div className={styles.goalMeta}>
      <span>Weight: {goal.weightPercentage}%</span>
      <span>Priority: {goal.priority}</span>
      <span>Due: {goal.targetDate}</span>
      <GoalStatusTag status={goal.status} />
    </div>

    <Progress
      percent={goal.achievementPercentage}
      size="small"
      style={{ marginBottom: 8 }}
    />

    {goal.keyResults.length > 0 && (
      <table className={styles.keyResultsTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Target</th>
            <th>Current</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {goal.keyResults.map((kr, idx) => (
            <tr key={kr.krId}>
              <td>{idx + 1}</td>
              <td>{kr.description}</td>
              <td>
                {kr.targetValue} {kr.unit}
              </td>
              <td>{kr.currentValue}</td>
              <td>
                <Tag color="processing" style={{ fontSize: 10 }}>
                  {kr.status}
                </Tag>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </Card>
);

export default GoalCard;
