"use client";

import React from "react";
import { Progress, Row, Col, Statistic, Typography, Spin, Alert, Button, Space } from "antd";
import { EngagementStats } from "../../types/domain.types";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Text } = Typography;

interface EngagementStatsPanelProps {
  stats: EngagementStats | null;
  loading: boolean;
  /** REPORT or MANAGE — gates the retry action (handover §6.4). */
  canRetryEmails?: boolean;
  onRetryFailedEmails?: () => void;
  retryingEmails?: boolean;
}

/**
 * Mirrors the backend `EngagementResponse`. There is no read-reminder endpoint
 * and no per-employee unread list in the contract, so this is a summary view.
 */
const EngagementStatsPanel: React.FC<EngagementStatsPanelProps> = ({
  stats,
  loading,
  canRetryEmails = false,
  onRetryFailedEmails,
  retryingEmails = false,
}) => {
  if (loading) return <Spin size="small" />;
  if (!stats) return null;

  // unreadCount is authoritative when present; fall back to arithmetic.
  const unread = stats.unreadCount ?? Math.max(stats.totalTargetEmployees - stats.readCount, 0);
  const showAck = !!stats.acknowledgmentRequired;
  const ackRate =
    stats.acknowledgmentRate ??
    (stats.totalTargetEmployees > 0
      ? ((stats.acknowledgedCount ?? 0) / stats.totalTargetEmployees) * 100
      : 0);
  const emailFailed = stats.emailFailedCount ?? 0;
  const hasEmailData =
    stats.emailSentCount !== undefined ||
    stats.emailPendingCount !== undefined ||
    stats.emailFailedCount !== undefined ||
    stats.emailNoAddressCount !== undefined;

  return (
    <div className={styles.engagementPanel}>
      <Typography.Text strong>Engagement Stats</Typography.Text>

      <div style={{ marginTop: 8 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Read — {stats.readCount} / {stats.totalTargetEmployees}
        </Typography.Text>
        <Progress
          percent={Math.round(stats.readRate)}
          status={stats.readRate === 100 ? "success" : "active"}
        />
      </div>

      {showAck && (
        <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Acknowledged — {stats.acknowledgedCount ?? 0} / {stats.totalTargetEmployees}
          </Typography.Text>
          <Progress
            percent={Math.round(ackRate)}
            status={ackRate === 100 ? "success" : "normal"}
            strokeColor="#1677ff"
          />
        </div>
      )}

      <Row gutter={16}>
        <Col span={8}>
          <Statistic title="Read" value={stats.readCount} valueStyle={{ fontSize: 16, color: "#52c41a" }} />
        </Col>
        <Col span={8}>
          <Statistic title="Unread" value={unread} valueStyle={{ fontSize: 16, color: "#faad14" }} />
        </Col>
        <Col span={8}>
          <Statistic
            title="Total Recipients"
            value={stats.totalTargetEmployees}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
      </Row>

      {showAck && (stats.overdueAcknowledgmentCount ?? 0) > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          message={`${stats.overdueAcknowledgmentCount} acknowledgement${
            stats.overdueAcknowledgmentCount === 1 ? "" : "s"
          } overdue`}
        />
      )}

      {/* Audience mail is queued, not sent synchronously — partial failure is normal. */}
      {hasEmailData && (
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ fontSize: 13 }}>Email delivery</Text>
          <Row gutter={16} style={{ marginTop: 4 }}>
            <Col span={6}>
              <Statistic title="Sent" value={stats.emailSentCount ?? 0} valueStyle={{ fontSize: 15 }} />
            </Col>
            <Col span={6}>
              <Statistic title="Queued" value={stats.emailPendingCount ?? 0} valueStyle={{ fontSize: 15 }} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Failed"
                value={emailFailed}
                valueStyle={{ fontSize: 15, color: emailFailed > 0 ? "#ff4d4f" : undefined }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="No address"
                value={stats.emailNoAddressCount ?? 0}
                valueStyle={{ fontSize: 15 }}
              />
            </Col>
          </Row>
        </div>
      )}

      {emailFailed > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 12 }}
          message={`${emailFailed} email${emailFailed === 1 ? "" : "s"} failed to send`}
          description={
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Text style={{ fontSize: 13 }}>
                Re-queueing sends again only to the recipients that failed. Delivery is
                rate-limited, so the counts update as the queue drains.
              </Text>
              {canRetryEmails && onRetryFailedEmails && (
                <Button size="small" danger loading={retryingEmails} onClick={onRetryFailedEmails}>
                  Retry failed emails
                </Button>
              )}
            </Space>
          }
        />
      )}

      {/* Recipients with no address on file are not retryable — fix the record. */}
      {(stats.emailNoAddressCount ?? 0) > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          message={`${stats.emailNoAddressCount} recipient${
            stats.emailNoAddressCount === 1 ? " has" : "s have"
          } no email address on file`}
          description="Retrying will not reach them — their employee record needs an address."
        />
      )}
    </div>
  );
};

export default EngagementStatsPanel;
