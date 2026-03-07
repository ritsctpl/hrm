'use client';

import React from "react";
import { Button, Card, Col, Empty, Row, Spin, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import CycleBanner from "../molecules/CycleBanner";
import AppraisalLandingTable from "../organisms/AppraisalLandingTable";
import FeedbackItemCard from "../molecules/FeedbackItemCard";
import ScoreCircle from "../atoms/ScoreCircle";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import { totalGoalWeight } from "../../utils/appraisalCalculations";
import styles from "../../styles/AppraisalLanding.module.css";

const AppraisalLandingTemplate: React.FC = () => {
  const {
    activeCycle,
    myGoals,
    myFeedback,
    myReview,
    loadingCycles,
    loadingGoals,
    setCurrentView,
    setGoalFormOpen,
    goalFormState,
  } = useHrmAppraisalStore();

  if (loadingCycles) {
    return <Spin style={{ display: "block", textAlign: "center", padding: 48 }} />;
  }

  if (!activeCycle) {
    return (
      <Empty
        description="No active appraisal cycle found."
        style={{ padding: 48 }}
      />
    );
  }

  const weightSum = totalGoalWeight(myGoals);

  return (
    <div>
      <CycleBanner cycle={activeCycle} />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card
            className={styles.summaryCard}
            size="small"
            title="My Goals"
            extra={<Button size="small" icon={<PlusOutlined />} onClick={() => setGoalFormOpen(true)}>Add</Button>}
            onClick={() => setCurrentView("GOAL_SETTING")}
          >
            <div style={{ textAlign: "center" }}>
              <ScoreCircle score={myReview?.selfAssessment?.overallRating ?? 0} size={64} />
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                {myGoals.length} Active · {weightSum}% weight
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            className={styles.summaryCard}
            size="small"
            title="Self Assessment"
            onClick={() => setCurrentView("SELF_ASSESSMENT")}
          >
            <Typography.Text type={myReview?.selfAssessment?.submittedDate ? "success" : "warning"}>
              {myReview?.selfAssessment?.submittedDate
                ? `Submitted: ${myReview.selfAssessment.submittedDate}`
                : "Not Submitted"}
            </Typography.Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            className={styles.summaryCard}
            size="small"
            title="Pending Actions"
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {myFeedback.filter((f) => !f.acknowledged).length} unacknowledged feedbacks
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card size="small" title="My Goals Overview" style={{ marginBottom: 16 }}>
        <AppraisalLandingTable goals={myGoals} loading={loadingGoals} />
      </Card>

      {myFeedback.length > 0 && (
        <Card size="small" title="Recent Feedback">
          {myFeedback.slice(0, 3).map((f) => (
            <FeedbackItemCard key={f.feedbackId} entry={f} />
          ))}
        </Card>
      )}
    </div>
  );
};

export default AppraisalLandingTemplate;
