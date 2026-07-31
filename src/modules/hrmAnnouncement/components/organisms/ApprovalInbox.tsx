"use client";

import React from "react";
import { Table, Button, Space, Tag, Tooltip, Typography, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, CloseOutlined, RollbackOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Announcement } from "../../types/domain.types";
import type { AnnouncementPermissions } from "../../hooks/useAnnouncementPermissions";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import ApprovalLevelIndicator, { currentStep } from "../molecules/ApprovalLevelIndicator";
import type { ApprovalAction } from "./ApprovalActionModal";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Text } = Typography;

/** Maps a rung's requiredPermission onto the grants this user holds. */
function holdsRequiredPermission(
  requiredPermission: string | undefined,
  can: AnnouncementPermissions
): boolean {
  switch (requiredPermission) {
    case "ANNOUNCEMENT_APPROVE_L1":
      return can.approveL1;
    case "ANNOUNCEMENT_APPROVE_TOP":
      return can.approveTop;
    default:
      // Unknown rung — let the server be the authority rather than guessing.
      return can.approveL1 || can.approveTop;
  }
}

interface ApprovalInboxProps {
  items: Announcement[];
  loading: boolean;
  can: AnnouncementPermissions;
  /** Current user's employee code — used to block self-approval. */
  actorId: string;
  onAction: (announcement: Announcement, action: ApprovalAction) => void;
  onOpen: (announcement: Announcement) => void;
}

/**
 * Approval inbox (handover §6.2).
 *
 * Two hard rules, both enforced here as usability and again by the server:
 *   1. You may only action the rung whose requiredPermission you hold — an
 *      APPROVE_L1 holder viewing a TOP_LEVEL step sees it read-only, not a
 *      button that will 403.
 *   2. You may never action your own announcement.
 */
const ApprovalInbox: React.FC<ApprovalInboxProps> = ({
  items,
  loading,
  can,
  actorId,
  onAction,
  onOpen,
}) => {
  const columns: ColumnsType<Announcement> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string, record) => (
        <a onClick={() => onOpen(record)}>{title}</a>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (_, r) => <AnnouncementPriorityTag priority={r.priority} />,
    },
    {
      title: "Awaiting",
      key: "level",
      width: 240,
      render: (_, r) => <ApprovalLevelIndicator announcement={r} />,
    },
    {
      title: "Author",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 140,
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (v: string) =>
        v ? dayjs(v).format("DD-MMM-YYYY HH:mm") : <Text type="secondary">—</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 210,
      align: "right",
      render: (_, r) => {
        const step = currentStep(r);
        const isOwn = !!actorId && r.createdBy === actorId;
        const permitted = holdsRequiredPermission(step?.requiredPermission, can);

        if (isOwn) {
          return (
            <Tooltip title="You cannot action your own announcement">
              <Tag>your announcement</Tag>
            </Tooltip>
          );
        }
        if (!permitted) {
          return (
            <Tooltip title={`This step needs ${step?.requiredPermission ?? "another permission"}`}>
              <Tag>read-only</Tag>
            </Tooltip>
          );
        }

        return (
          <Space size={4} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Approve">
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => onAction(r, "approve")}
              />
            </Tooltip>
            <Tooltip title="Return for edit">
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => onAction(r, "return")}
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => onAction(r, "reject")}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.adminTemplate}>
      <Table
        rowKey="handle"
        columns={columns}
        dataSource={items}
        loading={loading}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{
          emptyText: <Empty description="Nothing is waiting for your approval" />,
        }}
      />
    </div>
  );
};

export default ApprovalInbox;
