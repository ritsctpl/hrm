"use client";

import React from "react";
import { Table, Space, Button, Popconfirm, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, CheckCircleOutlined, StopOutlined, EyeOutlined } from "@ant-design/icons";
import { PolicyDocument } from "../../types/domain.types";
import { PolicyAdminTableProps } from "../../types/ui.types";
import PolicyTypeBadge from "../atoms/PolicyTypeBadge";
import PolicyStatusTag from "../atoms/PolicyStatusTag";

const PolicyAdminTable: React.FC<PolicyAdminTableProps> = ({
  policies,
  loading,
  onEdit,
  onPublish,
  onArchive,
  onViewDetail,
}) => {
  const columns: ColumnsType<PolicyDocument> = [
    {
      title: "Code",
      dataIndex: "policyCode",
      key: "policyCode",
      width: 120,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <Button type="link" onClick={() => onViewDetail(record)} style={{ padding: 0 }}>
          {title}
        </Button>
      ),
    },
    {
      title: "Type",
      dataIndex: "documentType",
      key: "documentType",
      width: 110,
      render: (docType) => <PolicyTypeBadge docType={docType} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => <PolicyStatusTag status={status} />,
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 140,
    },
    {
      title: "Version",
      dataIndex: "currentVersion",
      key: "currentVersion",
      width: 80,
      render: (v) => `v${v}`,
    },
    {
      title: "Effective",
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
      width: 110,
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "-",
    },
    {
      title: "Published",
      dataIndex: "publishedDateTime",
      key: "publishedDateTime",
      width: 110,
      defaultSortOrder: "descend",
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetail(record)} />
          </Tooltip>
          <Tooltip title="Edit Policy">
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          {record.status === "DRAFT" && (
            <Popconfirm
              title="Submit for review?"
              description="This will send the policy for review."
              onConfirm={() => onPublish(record.handle)}
              okText="Submit"
            >
              <Tooltip title="Submit for Review">
                <Button size="small" icon={<CheckCircleOutlined />}  />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === "REVIEW" && (
            <Popconfirm
              title="Approve this policy?"
              description="This will approve the policy after review."
              onConfirm={() => onPublish(record.handle)}
              okText="Approve"
            >
              <Tooltip title="Approve Policy">
                <Button size="small" icon={<CheckCircleOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === "APPROVED" && (
            <Popconfirm
              title="Publish this policy?"
              description="This will make the policy visible to all employees."
              onConfirm={() => onPublish(record.handle)}
              okText="Publish"
            >
              <Tooltip title="Publish Policy">
                <Button size="small" icon={<CheckCircleOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          {record.status === "PUBLISHED" && (
            <Popconfirm
              title="Are you sure you want to retire this policy?"
              description="This action will change the policy status to RETIRED."
              onConfirm={() => onArchive(record.handle)}
              okText="Yes, Retire"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Retire Policy">
                <Button size="small" icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={policies}
      rowKey="handle"
      loading={loading}
      size="small"
      pagination={false}
      scroll={{ y: 'calc(100vh - 280px)' }}
    />
  );
};

export default PolicyAdminTable;
