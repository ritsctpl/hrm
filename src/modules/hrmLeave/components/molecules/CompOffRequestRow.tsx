"use client";

import React from "react";
import { Tag, Typography } from "antd";
import { CompOffRequest } from "../../types/api.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

interface CompOffRequestRowProps {
  request: CompOffRequest;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "orange",
  APPROVED: "green",
  REJECTED: "red",
  CREDITED: "blue",
};

const CompOffRequestRow: React.FC<CompOffRequestRowProps> = ({ request }) => {
  const workedDate = new Date(request.workedDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const submittedDate = new Date(request.createdDateTime).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className={styles.requestRow} style={{ cursor: "default" }}>
      <div className={styles.requestRowTop}>
        <Text strong style={{ fontSize: 13 }}>
          Worked: {workedDate}
        </Text>
        <Tag color={STATUS_COLOR[request.status] ?? "default"}>
          {request.status}
        </Tag>
      </div>
      <div className={styles.requestRowMid}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {request.hours}h = {request.quantity} day(s)
        </Text>
      </div>
      <div style={{ fontSize: 12, color: "#595959", padding: "2px 0" }}>
        {request.reason}
      </div>
      {request.status === "REJECTED" && request.rejectionReason && (
        <div style={{ fontSize: 12, color: "#ff4d4f", padding: "2px 0" }}>
          Rejection: {request.rejectionReason}
        </div>
      )}
      <div className={styles.requestRowBottom}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          Submitted: {submittedDate}
        </Text>
      </div>
    </div>
  );
};

export default CompOffRequestRow;
