"use client";

import React from "react";
import { Card, Typography, Space } from "antd";
import { PolicyCardProps } from "../../types/ui.types";
import PolicyTypeBadge from "../atoms/PolicyTypeBadge";
import styles from "../../styles/PolicyLanding.module.css";

const { Text, Title } = Typography;

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onClick }) => {
  const formattedDate = policy.effectiveFrom
    ? new Date(policy.effectiveFrom).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";

  return (
    <Card
      hoverable
      className={styles.policyCard}
      onClick={() => onClick(policy)}
      size="small"
    >
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <PolicyTypeBadge docType={policy.documentType} />
        <Title level={5} className={styles.policyCardTitle} ellipsis={{ rows: 2 }}>
          {policy.title}
        </Title>
        <Text type="secondary" className={styles.policyCardMeta}>
          v{policy.currentVersion} &bull; {formattedDate}
        </Text>
      </Space>
    </Card>
  );
};

export default PolicyCard;
