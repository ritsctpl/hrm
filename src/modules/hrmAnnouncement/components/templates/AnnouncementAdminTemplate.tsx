"use client";

import React from "react";
import { Table, Button, Space, Popconfirm, Tag, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, SendOutlined, StopOutlined, PlusOutlined, BarChartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Announcement } from "../../types/domain.types";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import AnnouncementCategoryBadge from "../atoms/AnnouncementCategoryBadge";
import Can from "../../../hrmAccess/components/Can";
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_LABELS, normalizePriority } from "../../utils/constants";
import styles from "../../styles/HrmAnnouncement.module.css";

interface AnnouncementAdminTemplateProps {
  announcements: Announcement[];
  loading: boolean;
  onEdit: (announcement: Announcement) => void;
  onPublish: (announcementId: string) => void;
  /** Passes the whole record so the confirm modal can show title + read count. */
  onWithdraw: (announcement: Announcement) => void;
  onViewStats: (announcement: Announcement) => void;
  onCreateNew: () => void;
}

const AnnouncementAdminTemplate: React.FC<AnnouncementAdminTemplateProps> = ({
  announcements,
  loading,
  onEdit,
  onPublish,
  onWithdraw,
  onViewStats,
  onCreateNew,
}) => {
  // Filtering is client-side: the admin list is already fully loaded, and a
  // round trip per dropdown change would make the filters feel sluggish.
  const [statusFilter, setStatusFilter] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("");

  const visibleAnnouncements = React.useMemo(
    () =>
      announcements.filter(
        (a) =>
          (!statusFilter || a.status === statusFilter) &&
          (!priorityFilter || normalizePriority(a.priority) === priorityFilter)
      ),
    [announcements, statusFilter, priorityFilter]
  );

  const columns: ColumnsType<Announcement> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title) => <span className={styles.adminTitle}>{title}</span>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (p) => <AnnouncementPriorityTag priority={p} />,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 110,
      render: (c) => <AnnouncementCategoryBadge category={c} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s) => (
        <Tag color={STATUS_COLORS[s as keyof typeof STATUS_COLORS]}>
          {STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s}
        </Tag>
      ),
    },
    {
      title: "Published",
      dataIndex: "publishedAt",
      key: "publishedAt",
      width: 120,
      render: (d) => (d ? dayjs(d).format("DD-MMM-YYYY") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Can I="edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Can>
          <Button size="small" icon={<BarChartOutlined />} onClick={() => onViewStats(record)} />
          {record.status === "DRAFT" && (
            <Can I="edit">
              <Popconfirm title="Publish?" onConfirm={() => onPublish(record.handle)} okText="Publish">
                <Button size="small" icon={<SendOutlined />} type="primary" />
              </Popconfirm>
            </Can>
          )}
          {record.status === "PUBLISHED" && (
            <Can I="edit">
              {/* Opens WithdrawConfirmModal — withdrawing needs a reason for the
                  audit trail, which a Popconfirm can't collect. */}
              <Button
                size="small"
                icon={<StopOutlined />}
                danger
                onClick={() => onWithdraw(record)}
              />
            </Can>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.adminTemplate}>
      <div className={styles.adminToolbar}>
        <Can I="add">
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateNew}>
            New Announcement
          </Button>
        </Can>
        <Select
          allowClear
          placeholder="Status"
          style={{ width: 170 }}
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v ?? "")}
          options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select
          allowClear
          placeholder="Priority"
          style={{ width: 140 }}
          value={priorityFilter || undefined}
          onChange={(v) => setPriorityFilter(v ?? "")}
          options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <Table
        columns={columns}
        dataSource={visibleAnnouncements}
        rowKey="handle"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default AnnouncementAdminTemplate;
