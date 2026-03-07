'use client';

import React from "react";
import { Progress, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import GoalStatusTag from "../atoms/GoalStatusTag";
import type { AppraisalGoal } from "../../types/domain.types";
import { GOAL_CATEGORY_COLORS } from "../../utils/appraisalConstants";

interface Props {
  goals: AppraisalGoal[];
  loading?: boolean;
}

const AppraisalLandingTable: React.FC<Props> = ({ goals, loading }) => {
  const totalWeight = goals.reduce((sum, g) => sum + g.weightPercentage, 0);

  const columns: ColumnsType<AppraisalGoal> = [
    {
      title: "Goal Title",
      dataIndex: "goalTitle",
      key: "goalTitle",
    },
    {
      title: "Category",
      dataIndex: "goalCategory",
      key: "goalCategory",
      width: 120,
      render: (c) => (
        <Tag color={GOAL_CATEGORY_COLORS[c as keyof typeof GOAL_CATEGORY_COLORS] ?? "default"}>
          {c}
        </Tag>
      ),
    },
    {
      title: "Weight",
      dataIndex: "weightPercentage",
      key: "weightPercentage",
      width: 80,
      render: (w) => `${w}%`,
    },
    {
      title: "Progress",
      dataIndex: "achievementPercentage",
      key: "achievementPercentage",
      width: 150,
      render: (p) => <Progress percent={p} size="small" />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s) => <GoalStatusTag status={s} />,
    },
  ];

  return (
    <Table
      dataSource={goals}
      columns={columns}
      rowKey="goalId"
      size="small"
      loading={loading}
      pagination={false}
      footer={() => (
        <div style={{ textAlign: "right", fontWeight: 600, fontSize: 13 }}>
          Total Weight: {totalWeight}%
        </div>
      )}
    />
  );
};

export default AppraisalLandingTable;
