'use client';

import React, { useState } from "react";
import { Button, Divider, Form, Input, Typography } from "antd";
import RatingStarInput from "../atoms/RatingStarInput";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import { RATING_LABELS } from "../../utils/appraisalConstants";
import styles from "../../styles/SelfAssessment.module.css";

const SelfAssessmentForm: React.FC = () => {
  const { myReview, myGoals, activeCycle, submittingAssessment, submitSelfAssessment } =
    useHrmAppraisalStore();
  const [goalRatings, setGoalRatings] = useState<Record<string, { rating: number; comments: string }>>({});
  const [competencyRatings, setCompetencyRatings] = useState<Record<string, { rating: number; comments: string }>>({});
  const [overallComments, setOverallComments] = useState("");

  const setGoalRating = (goalId: string, rating: number) =>
    setGoalRatings((prev) => ({ ...prev, [goalId]: { ...prev[goalId], rating } }));
  const setGoalComment = (goalId: string, comments: string) =>
    setGoalRatings((prev) => ({ ...prev, [goalId]: { ...prev[goalId], comments } }));
  const setCompetencyRating = (cId: string, rating: number) =>
    setCompetencyRatings((prev) => ({ ...prev, [cId]: { ...prev[cId], rating } }));
  const setCompetencyComment = (cId: string, comments: string) =>
    setCompetencyRatings((prev) => ({ ...prev, [cId]: { ...prev[cId], comments } }));

  const handleSubmit = async () => {
    if (!myReview) return;
    await submitSelfAssessment(myReview.reviewId, {
      site: "",
      goalRatings: myGoals.map((g) => ({
        goalId: g.goalId,
        selfRating: goalRatings[g.goalId]?.rating ?? 0,
        selfComments: goalRatings[g.goalId]?.comments ?? "",
      })),
      competencyRatings: (activeCycle?.competencyFramework ?? []).map((c) => ({
        competencyId: c.competencyId,
        rating: competencyRatings[c.competencyId]?.rating ?? 0,
        comments: competencyRatings[c.competencyId]?.comments ?? "",
      })),
      overallComments,
      submittedBy: "",
    });
  };

  return (
    <div className={styles.assessmentRoot}>
      <Typography.Title level={5} className={styles.sectionTitle}>
        Section A: Goal Ratings ({activeCycle?.goalWeightPercentage ?? 70}% weight)
      </Typography.Title>

      {myGoals.map((goal) => (
        <div key={goal.goalId} className={styles.goalRatingBlock}>
          <div className={styles.goalTitle}>{goal.goalTitle}</div>
          <div className={styles.goalMeta}>
            Weight: {goal.weightPercentage}% · Achievement: {goal.achievementPercentage}%
          </div>
          <div style={{ marginBottom: 8 }}>
            <Typography.Text style={{ fontSize: 12, color: "#666", marginBottom: 4, display: "block" }}>
              Self Rating:
            </Typography.Text>
            <RatingStarInput
              value={goalRatings[goal.goalId]?.rating ?? 0}
              onChange={(v) => setGoalRating(goal.goalId, v)}
            />
            <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>
              {Object.entries(RATING_LABELS).map(([k, v]) => `${k}=${v}`).join(" · ")}
            </div>
          </div>
          <Input.TextArea
            rows={2}
            placeholder="Comments..."
            value={goalRatings[goal.goalId]?.comments ?? ""}
            onChange={(e) => setGoalComment(goal.goalId, e.target.value)}
          />
        </div>
      ))}

      {(activeCycle?.competencyFramework ?? []).length > 0 && (
        <>
          <Typography.Title level={5} className={styles.sectionTitle}>
            Section B: Competency Ratings ({activeCycle?.competencyWeightPercentage ?? 30}% weight)
          </Typography.Title>
          {activeCycle?.competencyFramework.map((comp) => (
            <div key={comp.competencyId} className={styles.goalRatingBlock}>
              <div className={styles.goalTitle}>{comp.name}</div>
              <div className={styles.goalMeta}>Weight: {comp.weightPercentage}%</div>
              <RatingStarInput
                value={competencyRatings[comp.competencyId]?.rating ?? 0}
                onChange={(v) => setCompetencyRating(comp.competencyId, v)}
              />
              <Input.TextArea
                rows={2}
                placeholder="Comments..."
                value={competencyRatings[comp.competencyId]?.comments ?? ""}
                onChange={(e) => setCompetencyComment(comp.competencyId, e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>
          ))}
        </>
      )}

      <Divider />
      <div style={{ marginBottom: 12 }}>
        <Typography.Text strong>Overall Comments</Typography.Text>
        <Input.TextArea
          rows={3}
          value={overallComments}
          onChange={(e) => setOverallComments(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </div>

      <div className={styles.submitBar}>
        <Button>Save Draft</Button>
        <Button type="primary" loading={submittingAssessment} onClick={handleSubmit}>
          Submit Self Assessment
        </Button>
      </div>
    </div>
  );
};

export default SelfAssessmentForm;
