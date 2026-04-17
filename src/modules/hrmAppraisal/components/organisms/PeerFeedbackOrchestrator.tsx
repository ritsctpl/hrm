'use client';

import React, { useState } from "react";
import { Button, Checkbox, Space, Table, Tabs, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import Can from "../../../hrmAccess/components/Can";
import RatingStarDisplay from "../atoms/RatingStarDisplay";
import RadarChartPanel from "./RadarChartPanel";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import type { PeerFeedbackEntry } from "../../types/domain.types";
import { HrmAppraisalService } from "../../services/hrmAppraisalService";
import { parseCookies } from "nookies";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import styles from "../../styles/Feedback360.module.css";

const PeerFeedbackOrchestrator: React.FC = () => {
  const { myReview, activeCycle } = useHrmAppraisalStore();
  const [anonymous, setAnonymous] = useState(true);
  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);

  const peerFeedback = myReview?.peerFeedback ?? [];

  const responseColumns: ColumnsType<PeerFeedbackEntry> = [
    {
      title: "Submitted",
      dataIndex: "submittedDate",
      key: "submittedDate",
      width: 130,
    },
    {
      title: "Relationship",
      dataIndex: "relationship",
      key: "relationship",
      width: 120,
      render: (r) => <Tag>{r}</Tag>,
    },
    {
      title: "Comments",
      dataIndex: "overallComments",
      key: "overallComments",
    },
  ];

  const handleSendRequests = async () => {
    if (!myReview) return;
    const organizationId = getOrganizationId();
    const requestedBy = parseCookies().employeeId ?? "";
    try {
      await HrmAppraisalService.requestPeerFeedback(
        organizationId,
        myReview.reviewId,
        selectedPeers,
        anonymous,
        requestedBy
      );
      message.success("Feedback requests sent");
    } catch {
      message.error("Failed to send requests");
    }
  };

  const competencies = activeCycle?.competencyFramework.map((c) => c.name) ?? [];
  const selfRatings = (myReview?.selfAssessment?.competencyRatings ?? []).map((r) => r.rating);
  const managerRatings = (myReview?.managerAssessment?.competencyRatings ?? []).map((r) => r.rating);
  const peerAvgRatings = competencies.map((_, i) => {
    const values = peerFeedback.flatMap((p) => (p.ratings[i] ? [p.ratings[i].rating] : []));
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });

  const tabItems = [
    {
      key: "request",
      label: "Request Feedback",
      children: (
        <div className={styles.feedbackRoot}>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
            Select peers to request feedback from.
          </Typography.Text>
          <Table
            dataSource={[]}
            columns={[
              { title: "Name", dataIndex: "name" },
              { title: "Department", dataIndex: "department" },
              { title: "Status", dataIndex: "status" },
            ]}
            rowKey="peerId"
            size="small"
            locale={{ emptyText: "No peers selected yet" }}
            pagination={false}
          />
          <div style={{ marginTop: 12 }}>
            <Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}>
              Request anonymous feedback
            </Checkbox>
          </div>
          <Space style={{ marginTop: 12 }}>
            <Can I="add">
              <Button type="primary" onClick={handleSendRequests}>
                Send Feedback Requests
              </Button>
            </Can>
            <Can I="edit">
              <Button>Send Reminder to Pending</Button>
            </Can>
          </Space>
        </div>
      ),
    },
    {
      key: "responses",
      label: `Responses (${peerFeedback.filter((p) => p.submittedDate).length}/${peerFeedback.length})`,
      children: (
        <div className={styles.feedbackRoot}>
          <Table
            dataSource={peerFeedback}
            columns={responseColumns}
            rowKey="peerId"
            size="small"
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: "aggregate",
      label: "Aggregate View",
      children: (
        <div className={styles.feedbackRoot}>
          {competencies.length > 0 ? (
            <div className={styles.radarContainer}>
              <RadarChartPanel
                competencies={competencies}
                selfRatings={selfRatings}
                managerRatings={managerRatings}
                peerAvgRatings={peerAvgRatings}
              />
            </div>
          ) : (
            <Typography.Text type="secondary">
              No competency data available for radar chart.
            </Typography.Text>
          )}
        </div>
      ),
    },
  ];

  return <Tabs items={tabItems} />;
};

export default PeerFeedbackOrchestrator;
