"use client";

import React from "react";
import { Alert, Button, Space, Typography, Tag } from "antd";
import { formatDateTime, isPast } from "@/utils/dateUtils";
import type { Announcement } from "../../types/domain.types";

const { Text } = Typography;

interface RatificationBannerProps {
  announcement: Announcement;
  /** Only ANNOUNCEMENT_MANAGE holders get the actions; the rest see the state. */
  canRatify: boolean;
  onRatify: () => void;
  onRefuse: () => void;
}

/**
 * Emergency ratification banner (handover §6.3).
 *
 * Amber while the window is open, red once the deadline has passed. Shown to
 * everyone so the pending state is visible; actions appear only for holders of
 * ANNOUNCEMENT_MANAGE — with no approval levels left there is no "top level"
 * to name, so HR administration is what signs an emergency off.
 */
const RatificationBanner: React.FC<RatificationBannerProps> = ({
  announcement,
  canRatify,
  onRatify,
  onRefuse,
}) => {
  const status = announcement.ratificationStatus;
  if (!status) return null;

  if (status === "RATIFIED") {
    return (
      <Alert
        type="success"
        showIcon
        style={{ marginBottom: 12 }}
        message="Emergency publish ratified"
        description={
          <>
            {announcement.ratifiedBy ? `Ratified by ${announcement.ratifiedBy}` : "Ratified"}
            {announcement.ratifiedAt ? ` on ${formatDateTime(announcement.ratifiedAt)}` : ""}
          </>
        }
      />
    );
  }

  if (status === "REFUSED") {
    return (
      <Alert
        type="error"
        showIcon
        style={{ marginBottom: 12 }}
        message="Ratification refused — announcement withdrawn"
        description="It no longer appears in employee feeds. The emails that already went out were not recalled."
      />
    );
  }

  // PENDING
  const deadline = announcement.ratificationDeadline;
  const overdue = isPast(deadline);

  return (
    <Alert
      type={overdue ? "error" : "warning"}
      showIcon
      style={{ marginBottom: 12 }}
      message={
        <Space size={8}>
          <span>Published — awaiting ratification</span>
          {overdue && <Tag color="red">overdue</Tag>}
        </Space>
      }
      description={
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text style={{ fontSize: 13 }}>
            This was published as an emergency, bypassing approval.
            {deadline && (
              <>
                {" "}
                HR must ratify by{" "}
                <Text strong>{formatDateTime(deadline)}</Text>
                {overdue ? " — that deadline has passed." : "."}
              </>
            )}
          </Text>
          {canRatify && (
            <Space>
              <Button size="small" type="primary" onClick={onRatify}>
                Ratify
              </Button>
              <Button size="small" danger onClick={onRefuse}>
                Refuse
              </Button>
            </Space>
          )}
        </Space>
      }
    />
  );
};

export default RatificationBanner;
