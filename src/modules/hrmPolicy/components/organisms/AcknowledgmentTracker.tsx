"use client";

import React from "react";
import { Progress, Space, Typography, Button, Statistic, Row, Col } from "antd";
import { BellOutlined, EyeOutlined } from "@ant-design/icons";
import { AcknowledgmentTrackerProps } from "../../types/ui.types";
import styles from "../../styles/PolicyViewer.module.css";

const AcknowledgmentTracker: React.FC<AcknowledgmentTrackerProps> = ({
  report,
  loading,
  onSendReminder,
  onViewFullReport,
}) => (
  <div className={styles.ackTracker}>
    <Typography.Text strong>Acknowledgment Tracking</Typography.Text>
    <Progress
      percent={report.percentage}
      status={report.percentage === 100 ? "success" : "active"}
      format={(p) => `${p}%`}
    />
    <Row gutter={16}>
      <Col span={8}>
        <Statistic title="Acknowledged" value={report.acknowledged} valueStyle={{ color: "#52c41a", fontSize: 16 }} />
      </Col>
      <Col span={8}>
        <Statistic title="Pending" value={report.pending} valueStyle={{ color: "#faad14", fontSize: 16 }} />
      </Col>
      <Col span={8}>
        <Statistic title="Overdue" value={report.overdue} valueStyle={{ color: "#ff4d4f", fontSize: 16 }} />
      </Col>
    </Row>
    <Space>
      {onViewFullReport && (
        <Button size="small" icon={<EyeOutlined />} onClick={onViewFullReport}>
          View Full Report
        </Button>
      )}
      {onSendReminder && (
        <Button size="small" icon={<BellOutlined />} onClick={onSendReminder} disabled={loading}>
          Send Reminder to Pending
        </Button>
      )}
    </Space>
  </div>
);

export default AcknowledgmentTracker;
