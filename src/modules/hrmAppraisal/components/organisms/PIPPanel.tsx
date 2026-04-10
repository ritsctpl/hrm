'use client';

import React from "react";
import { Alert, Button, Empty, Space, Tag, Typography } from "antd";
import Can from "../../../hrmAccess/components/Can";
import { useHrmAppraisalStore } from "../../stores/hrmAppraisalStore";
import PIPObjectiveRow from "../molecules/PIPObjectiveRow";

const PIPPanel: React.FC = () => {
  const { activePip, myReview } = useHrmAppraisalStore();

  const finalRating = myReview?.finalRating ?? 0;

  if (!activePip && finalRating >= 3) {
    return (
      <Alert
        type="success"
        message="PIP Not Applicable"
        description="Rating was 3 or above. No PIP initiated."
        showIcon
      />
    );
  }

  if (!activePip) {
    return (
      <Empty description="No active PIP" />
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <Typography.Text strong>PIP ID: {activePip.pipId}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Period: {activePip.startDate} — {activePip.endDate}
          </Typography.Text>
        </div>
        <Tag
          color={
            activePip.status === "COMPLETED"
              ? "green"
              : activePip.status === "FAILED"
              ? "red"
              : "processing"
          }
        >
          {activePip.status}
        </Tag>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">Reason:</Typography.Text>
        <div>{activePip.reason}</div>
      </div>

      <Typography.Text strong>Objectives:</Typography.Text>
      {activePip.objectives.map((obj, idx) => (
        <PIPObjectiveRow key={obj.objectiveId} objective={obj} index={idx} />
      ))}

      <Space style={{ marginTop: 12 }}>
        <Can I="edit">
          <Button size="small">Update Progress</Button>
        </Can>
        <Can I="delete">
          <Button size="small" danger>
            Close PIP
          </Button>
        </Can>
      </Space>
    </div>
  );
};

export default PIPPanel;
