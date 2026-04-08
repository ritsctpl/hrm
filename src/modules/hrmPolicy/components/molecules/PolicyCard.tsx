"use client";

import React from "react";
import { Typography } from "antd";
import { FileTextOutlined, CalendarOutlined } from "@ant-design/icons";
import { PolicyCardProps } from "../../types/ui.types";
import PolicyTypeBadge from "../atoms/PolicyTypeBadge";
import styles from "../../styles/PolicyLanding.module.css";

const { Text, Title } = Typography;

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, onClick }) => {
  const formattedDate = policy.effectiveFrom
    ? new Date(policy.effectiveFrom).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className={styles.policyCard} onClick={() => onClick(policy)}>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <PolicyTypeBadge docType={policy.documentType} />
          <Text style={{ fontSize: 11, color: '#bfbfbf' }}>v{policy.currentVersion}</Text>
        </div>

        <Title level={5} className={styles.policyCardTitle} ellipsis={{ rows: 2 }}>
          {policy.title}
        </Title>

        {policy.description && (
          <Text
            type="secondary"
            style={{ fontSize: 12, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {policy.description}
          </Text>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          {formattedDate && (
            <span style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarOutlined style={{ fontSize: 10 }} />
              {formattedDate}
            </span>
          )}
          {policy.categoryName && (
            <span style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileTextOutlined style={{ fontSize: 10 }} />
              {policy.categoryName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyCard;
