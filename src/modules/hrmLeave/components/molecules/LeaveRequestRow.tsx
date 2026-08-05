"use client";

import React from "react";
import { Button, Typography, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import LeaveTypeTag from "../atoms/LeaveTypeTag";
import LeaveStatusChip from "../atoms/LeaveStatusChip";
import HalfDayIndicator from "../atoms/HalfDayIndicator";
import { LeaveRequestRowProps } from "../../types/ui.types";
import styles from "../../styles/HrmLeave.module.css";

const { Text } = Typography;

const LeaveRequestRow: React.FC<LeaveRequestRowProps> = ({
  request,
  isSelected,
  onClick,
  onEditDraft,
  onDelete,
}) => {
  const isPending = request.status.startsWith("PENDING");
  const isDraft = request.status === "DRAFT";
  const canDelete = isDraft || isPending;
  const fromDate = new Date(request.startDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
  const toDate = new Date(request.endDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div
      className={`${styles.requestRow} ${isSelected ? styles.requestRowSelected : ""}`}
      onClick={() => onClick(request)}
    >
      <div className={styles.requestRowTop}>
        <LeaveTypeTag code={request.leaveTypeCode} name={request.leaveTypeName} />
        <LeaveStatusChip status={request.status} />
      </div>
      <div className={styles.requestRowMid}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {fromDate} – {toDate}
        </Text>
        <HalfDayIndicator dayType={request.startDayType} />
      </div>
      <div className={styles.requestRowBottom}>
        <Text style={{ fontSize: 12 }}>{request.totalDays.toFixed(1)} days</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(request.createdDateTime).toLocaleDateString("en-GB")}
        </Text>
      </div>
      {isDraft && onEditDraft && (
        <div style={{ marginTop: 6, textAlign: "right" }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <Button
              size="small"
              type="link"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEditDraft(request);
              }}
            >
              Continue Editing
            </Button>
            {canDelete && onDelete && (
              <Popconfirm
                title="Delete Draft"
                description="Are you sure you want to delete this draft leave request?"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDelete(request);
                }}
                okText="Yes"
                cancelText="No"
                placement="topRight"
              >
                <Button
                  size="small"
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                >
                  Delete
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>
      )}
      {isPending && canDelete && onDelete && (
        <div style={{ marginTop: 6, textAlign: "right" }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
            <Popconfirm
              title="Delete Leave Request"
              description="This withdraws the request from your approver and removes it from their queue. Continue?"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(request);
              }}
              okText="Yes"
              cancelText="No"
              placement="topRight"
            >
              <Button
                size="small"
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              >
                Delete
              </Button>
            </Popconfirm>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestRow;
