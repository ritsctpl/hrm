"use client";

import React from "react";
import { Tag, Tooltip, Typography } from "antd";
import { ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
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

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

interface ExpiryInfo {
  status: "expired" | "soon" | "later";
  daysLeft: number;
  label: string;
  color: string;
  icon: React.ReactNode;
}

/**
 * Resolve a comp-off expiry into a coloured badge state.
 *   - expired   → already past `expiryDate`
 *   - soon      → expires within 14 days
 *   - later     → 14+ days away
 * Only shown for credited entries (PENDING / REJECTED haven't been
 * issued so the date is irrelevant).
 */
const getExpiryInfo = (
  expiryDate: string | undefined,
  status: string,
): ExpiryInfo | null => {
  if (!expiryDate) return null;
  if (!["APPROVED", "CREDITED"].includes(status)) return null;
  const expiryMs = new Date(expiryDate).getTime();
  if (Number.isNaN(expiryMs)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((expiryMs - today.getTime()) / 86_400_000);
  if (daysLeft < 0) {
    return {
      status: "expired",
      daysLeft,
      label: `Expired ${formatDate(expiryDate)}`,
      color: "red",
      icon: <WarningOutlined />,
    };
  }
  if (daysLeft <= 14) {
    return {
      status: "soon",
      daysLeft,
      label: daysLeft === 0
        ? "Expires today"
        : `Expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      color: "gold",
      icon: <ClockCircleOutlined />,
    };
  }
  return {
    status: "later",
    daysLeft,
    label: `Expires ${formatDate(expiryDate)}`,
    color: "default",
    icon: <ClockCircleOutlined />,
  };
};

const CompOffRequestRow: React.FC<CompOffRequestRowProps> = ({ request }) => {
  const workedDate = formatDate(request.workedDate);
  const submittedDate = formatDate(request.createdDateTime);
  const expiry = getExpiryInfo(request.expiryDate, request.status);

  return (
    <div className={styles.requestRow} style={{ cursor: "default" }}>
      <div className={styles.requestRowTop}>
        <Text strong style={{ fontSize: 13 }}>
          Worked: {workedDate}
        </Text>
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
          {expiry && (
            <Tooltip title={expiry.label}>
              <Tag color={expiry.color} icon={expiry.icon}>
                {expiry.status === "expired"
                  ? "Expired"
                  : expiry.status === "soon"
                    ? expiry.daysLeft === 0
                      ? "Today"
                      : `${expiry.daysLeft}d left`
                    : `Until ${formatDate(request.expiryDate!)}`}
              </Tag>
            </Tooltip>
          )}
          <Tag color={STATUS_COLOR[request.status] ?? "default"}>
            {request.status}
          </Tag>
        </span>
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
