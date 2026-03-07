"use client";

import React from "react";
import { Card, Typography, Space } from "antd";
import { PolicyDocument } from "../../types/domain.types";
import { PolicyCardProps } from "../../types/ui.types";
import PolicyTypeBadge from "../atoms/PolicyTypeBadge";
import AckStatusIcon from "../atoms/AckStatusIcon";
import styles from "../../styles/PolicyLanding.module.css";

const { Text, Title } = Typography;

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onClick }) => {
  const formattedDate = policy.effectiveDate
    ? new Date(policy.effectiveDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";

  return (
    <Card
      hoverable
      className={styles.policyCard}
      onClick={() => onClick(policy)}
      size="small"
    >
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <PolicyTypeBadge docType={policy.docType} />
        <Title level={5} className={styles.policyCardTitle} ellipsis={{ rows: 2 }}>
          {policy.title}
        </Title>
        <Text type="secondary" className={styles.policyCardMeta}>
          v{policy.currentVersion} &bull; {formattedDate}
        </Text>
        {policy.ackStatus && policy.ackStatus !== "NONE" && (
          <Space size={4}>
            <AckStatusIcon ackStatus={policy.ackStatus} acknowledgedAt={policy.acknowledgedAt} />
            <Text className={styles.policyAckLabel}>
              {policy.ackStatus === "ACKNOWLEDGED"
                ? `Ackd ${policy.acknowledgedAt ? new Date(policy.acknowledgedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : ""}`
                : policy.ackStatus === "OVERDUE"
                ? "Ack. Overdue"
                : "Ack. Required"}
            </Text>
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default PolicyCard;
