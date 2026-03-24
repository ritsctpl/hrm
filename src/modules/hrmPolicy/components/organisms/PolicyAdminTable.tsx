"use client";

import React from "react";
import { Table, Space, Button, Popconfirm } from "antd";
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
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => onViewDetail(record)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          {record.status === "DRAFT" && (
            <Popconfirm
              title="Submit for review?"
              description="This will send the policy for review."
              onConfirm={() => onPublish(record.handle)}
              okText="Submit"
            >
              <Button size="small" icon={<CheckCircleOutlined />}  />
            </Popconfirm>
          )}
          {record.status === "REVIEW" && (
            <Popconfirm
              title="Approve this policy?"
              description="This will approve the policy after review."
              onConfirm={() => onPublish(record.handle)}
              okText="Approve"
            >
              <Button size="small" icon={<CheckCircleOutlined />} type="primary" />
            </Popconfirm>
          )}
          {record.status === "APPROVED" && (
            <Popconfirm
              title="Publish this policy?"
              description="This will make the policy visible to all employees."
              onConfirm={() => onPublish(record.handle)}
              okText="Publish"
            >
              <Button size="small" icon={<CheckCircleOutlined />} type="primary" />
            </Popconfirm>
          )}
          {record.status === "PUBLISHED" && (
            <Popconfirm
              title="Archive this policy?"
              onConfirm={() => onArchive(record.handle)}
              okText="Archive"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" icon={<StopOutlined />} danger />
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
      pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => `${total} policies` }}
    />
  );
};

export default PolicyAdminTable;
