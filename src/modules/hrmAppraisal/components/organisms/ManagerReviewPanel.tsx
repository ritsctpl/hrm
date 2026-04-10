'use client';

import React, { useState } from "react";
import { Button, Divider, Input, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Can from "../../../hrmAccess/components/Can";
import RatingStarDisplay from "../atoms/RatingStarDisplay";
import RatingStarInput from "../atoms/RatingStarInput";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import { REVIEW_STATUS_COLORS } from "../../utils/appraisalConstants";
import type { AppraisalReview } from "../../types/domain.types";
import styles from "../../styles/ManagerReview.module.css";

const TeamReviewTable: React.FC = () => {
  const { teamReviews, loadingTeamReviews, setSelectedReview, setCurrentView } =
    useHrmAppraisalStore();

  const columns: ColumnsType<AppraisalReview> = [
    { title: "Employee", dataIndex: "employeeName", key: "employeeName" },
    { title: "Department", dataIndex: "department", key: "department", width: 130 },
    { title: "Designation", dataIndex: "designation", key: "designation", width: 150 },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (s) => (
        <Tag color={REVIEW_STATUS_COLORS[s] ?? "default"}>{s.replace(/_/g, " ")}</Tag>
      ),
    },
    {
      title: "Self Rating",
      key: "selfRating",
      width: 100,
      render: (_, r) => (
        r.selfAssessment?.overallRating
          ? <RatingStarDisplay value={r.selfAssessment.overallRating} showLabel={false} />
          : <Typography.Text type="secondary">—</Typography.Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Can I="edit">
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setSelectedReview(record);
              setCurrentView("MANAGER_REVIEW");
            }}
          >
            Review
          </Button>
        </Can>
      ),
    },
  ];

  return (
    <Table
      dataSource={teamReviews}
      columns={columns}
      rowKey="reviewId"
      size="small"
      loading={loadingTeamReviews}
      pagination={{ pageSize: 15 }}
    />
  );
};

const ManagerReviewPanel: React.FC = () => {
  const { selectedReview, submittingAssessment, submitManagerAssessment } = useHrmAppraisalStore();
  const [managerRatings, setManagerRatings] = useState<Record<string, number>>({});
  const [managerComments, setManagerComments] = useState<Record<string, string>>({});
  const [overallComments, setOverallComments] = useState("");

  if (!selectedReview) return <TeamReviewTable />;

  const handleSubmit = async () => {
    await submitManagerAssessment(selectedReview.reviewId, {
      site: "",
      goalRatings: (selectedReview.goals ?? []).map((g) => ({
        goalId: g.goalId,
        managerRating: managerRatings[g.goalId] ?? 0,
        managerComments: managerComments[g.goalId] ?? "",
      })),
      competencyRatings: [],
      overallComments,
      strengths: [],
      areasOfImprovement: [],
      recommendedRating: 0,
      promotionRecommendation: false,
      compensationRecommendation: "",
      submittedBy: "",
    });
  };

  return (
    <div className={styles.reviewRoot}>
      <div className={styles.reviewHeader}>
        <span className={styles.reviewHeaderItem}>
          Employee: <strong>{selectedReview.employeeName}</strong>
        </span>
        <span className={styles.reviewHeaderItem}>Dept: {selectedReview.department}</span>
        <span className={styles.reviewHeaderItem}>Review: {selectedReview.reviewId}</span>
      </div>

      <div className={styles.panelGrid}>
        <div className={styles.selfPanel}>
          <div className={styles.panelTitle}>Employee Self-Assessment (read-only)</div>
          {(selectedReview.goals ?? []).map((goal) => (
            <div key={goal.goalId} style={{ marginBottom: 12 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {goal.goalTitle} ({goal.weightPercentage}%)
              </Typography.Text>
              <div style={{ fontSize: 12, color: "#666" }}>Achievement: {goal.achievementPercentage}%</div>
              <RatingStarDisplay value={goal.selfRating} />
              {goal.selfComments && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  &quot;{goal.selfComments}&quot;
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.managerPanel}>
          <div className={styles.panelTitle}>Manager Assessment (editable)</div>
          {(selectedReview.goals ?? []).map((goal) => (
            <div key={goal.goalId} style={{ marginBottom: 12 }}>
              <Typography.Text strong style={{ fontSize: 13 }}>
                {goal.goalTitle}
              </Typography.Text>
              <RatingStarInput
                value={managerRatings[goal.goalId] ?? 0}
                onChange={(v) =>
                  setManagerRatings((prev) => ({ ...prev, [goal.goalId]: v }))
                }
              />
              <Input.TextArea
                rows={1}
                placeholder="Comments..."
                value={managerComments[goal.goalId] ?? ""}
                onChange={(e) =>
                  setManagerComments((prev) => ({ ...prev, [goal.goalId]: e.target.value }))
                }
                style={{ marginTop: 4 }}
              />
            </div>
          ))}
        </div>
      </div>

      <Divider />
      <div>
        <Typography.Text strong>Overall Comments</Typography.Text>
        <Input.TextArea
          rows={3}
          value={overallComments}
          onChange={(e) => setOverallComments(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </div>

      <div className={styles.submitBar}>
        <Can I="edit">
          <Button>Save Draft</Button>
        </Can>
        <Can I="edit">
          <Button type="primary" loading={submittingAssessment} onClick={handleSubmit}>
            Submit Manager Assessment
          </Button>
        </Can>
      </div>
    </div>
  );
};

export default ManagerReviewPanel;
