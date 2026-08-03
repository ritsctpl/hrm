"use client";

import React from "react";
import { Table, Button, Space, Tag, Tooltip, Typography, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckOutlined, CloseOutlined, RollbackOutlined } from "@ant-design/icons";
import { formatDateTime } from "@/utils/dateUtils";
import type { Announcement } from "../../types/domain.types";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import ApprovalStatusLine from "../molecules/ApprovalStatusLine";
import { useEmployeeNames } from "../../hooks/useEmployeeNames";
import type { ApprovalAction } from "./ApprovalActionModal";
import styles from "../../styles/HrmAnnouncement.module.css";

const { Text } = Typography;

interface ApprovalInboxProps {
  items: Announcement[];
  loading: boolean;
  /** Current user's employee code — used to block self-approval. */
  actorId: string;
  onAction: (announcement: Announcement, action: ApprovalAction) => void;
  onOpen: (announcement: Announcement) => void;
}

/**
 * Approval inbox.
 *
 * Approving is not a grant: `/getPendingApprovals` returns exactly the items
 * where the caller is the current approver and the item is still pending, so
 * every row here is actionable by definition. Deriving the buttons from a
 * permission instead would show actions the hierarchy never gave this user.
 *
 * The one guard left is self-approval — blocked unless the category opts in,
 * and re-checked by the server either way.
 */
const ApprovalInbox: React.FC<ApprovalInboxProps> = ({
  items,
  loading,
  actorId,
  onAction,
  onOpen,
}) => {
  const { nameOf } = useEmployeeNames();

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
      key: "approver",
      width: 240,
      render: (_, r) => <ApprovalStatusLine announcement={r} actorId={actorId} />,
    },
    {
      title: "Author",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 140,
      render: (v: string) => nameOf(v) || <Text type="secondary">—</Text>,
    },
    {
      title: "Submitted",
      key: "submittedAt",
      width: 150,
      render: (_, r) => {
        // The summary rows carry createdDateTime; the full record adds
        // submittedAt. createdAt only ever comes from a cached payload.
        const when = r.submittedAt ?? r.createdDateTime ?? r.createdAt;
        return formatDateTime(when) || <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 210,
      align: "right",
      render: (_, r) => {
        const isOwn = !!actorId && r.createdBy === actorId;

        if (isOwn) {
          return (
            <Tooltip title="You cannot action your own announcement">
              <Tag>your announcement</Tag>
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
