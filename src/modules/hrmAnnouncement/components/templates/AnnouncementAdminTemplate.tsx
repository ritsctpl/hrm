"use client";

import React from "react";
import { Table, Button, Space, Popconfirm, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, SendOutlined, StopOutlined, PlusOutlined, BarChartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Announcement } from "../../types/domain.types";
import AnnouncementPriorityTag from "../atoms/AnnouncementPriorityTag";
import AnnouncementCategoryBadge from "../atoms/AnnouncementCategoryBadge";
import AnnouncementComposeDrawer from "../organisms/AnnouncementComposeDrawer";
import { STATUS_COLORS } from "../../utils/constants";
import styles from "../../styles/HrmAnnouncement.module.css";

interface AnnouncementAdminTemplateProps {
  announcements: Announcement[];
  loading: boolean;
  showComposeDrawer: boolean;
  editAnnouncement: Announcement | null;
  site: string;
  onEdit: (announcement: Announcement) => void;
  onPublish: (announcementId: string) => void;
  onWithdraw: (announcementId: string) => void;
  onViewStats: (announcement: Announcement) => void;
  onCreateNew: () => void;
  onDrawerClose: () => void;
  onDrawerSaved: () => void;
}

const AnnouncementAdminTemplate: React.FC<AnnouncementAdminTemplateProps> = ({
  announcements,
  loading,
  showComposeDrawer,
  editAnnouncement,
  site,
  onEdit,
  onPublish,
  onWithdraw,
  onViewStats,
  onCreateNew,
  onDrawerClose,
  onDrawerSaved,
}) => {
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
      render: (s) => <Tag color={STATUS_COLORS[s as keyof typeof STATUS_COLORS]}>{s}</Tag>,
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
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Button size="small" icon={<BarChartOutlined />} onClick={() => onViewStats(record)} />
          {record.status === "DRAFT" && (
            <Popconfirm title="Publish?" onConfirm={() => onPublish(record.id)} okText="Publish">
              <Button size="small" icon={<SendOutlined />} type="primary" />
            </Popconfirm>
          )}
          {record.status === "PUBLISHED" && (
            <Popconfirm title="Withdraw?" onConfirm={() => onWithdraw(record.id)} okText="Withdraw" okButtonProps={{ danger: true }}>
              <Button size="small" icon={<StopOutlined />} danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.adminTemplate}>
      <div className={styles.adminToolbar}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreateNew}>
          New Announcement
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={announcements}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
      <AnnouncementComposeDrawer
        open={showComposeDrawer}
        editAnnouncement={editAnnouncement}
        site={site}
        onClose={onDrawerClose}
        onSaved={onDrawerSaved}
      />
    </div>
  );
};

export default AnnouncementAdminTemplate;
