"use client";

import React from "react";
import { Progress, Row, Col, Statistic, Typography, Spin } from "antd";
import { EngagementStats } from "../../types/domain.types";
import styles from "../../styles/HrmAnnouncement.module.css";

interface EngagementStatsPanelProps {
  stats: EngagementStats | null;
  loading: boolean;
}

const EngagementStatsPanel: React.FC<EngagementStatsPanelProps> = ({ stats, loading }) => {
  if (loading) return <Spin size="small" />;
  if (!stats) return null;

  return (
    <div className={styles.engagementPanel}>
      <Typography.Text strong>Engagement Stats</Typography.Text>
      <Progress
        percent={Math.round(stats.readPercentage)}
        status={stats.readPercentage === 100 ? "success" : "active"}
      />
      <Row gutter={16}>
        <Col span={12}>
          <Statistic title="Read" value={stats.readCount} valueStyle={{ fontSize: 16, color: "#52c41a" }} />
        </Col>
        <Col span={12}>
          <Statistic
            title="Total Recipients"
            value={stats.totalRecipients}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default EngagementStatsPanel;
