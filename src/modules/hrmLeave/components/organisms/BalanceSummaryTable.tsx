"use client";

import React from "react";
import { Table, Empty, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { InfoCircleOutlined } from "@ant-design/icons";
import { BalanceSummaryTableProps } from "../../types/ui.types";
import { LeaveBalance } from "../../types/domain.types";

const { Text } = Typography;

const BalanceSummaryTable: React.FC<BalanceSummaryTableProps> = ({
  balances,
  loading,
  onRowClick,
  selectedEmployeeId,
}) => {
  // Group balances by employee — here we handle flat list per leaveType
  const columns: ColumnsType<LeaveBalance> = [
    {
      title: "Leave Type",
      dataIndex: "leaveTypeName",
      key: "leaveTypeName",
    },
    {
      title: "Code",
      dataIndex: "leaveTypeCode",
      key: "leaveTypeCode",
      width: 60,
    },
    {
      title: "Available",
      dataIndex: "availableBalance",
      key: "available",
      width: 90,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "Used YTD",
      dataIndex: "ytdDebits",
      key: "ytdDebits",
      width: 90,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "Pending",
      dataIndex: "pendingApproval",
      key: "pendingApproval",
      width: 80,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "Current",
      dataIndex: "currentBalance",
      key: "currentBalance",
      width: 90,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "CF",
      dataIndex: "carryForwardAllowed",
      key: "cf",
      width: 50,
      render: (v: boolean) => (v ? "Yes" : "No"),
    },
  ];

  if (!selectedEmployeeId && !loading && balances.length === 0) {
    return (
      <Empty
        image={<InfoCircleOutlined style={{ fontSize: 36, color: "#bfbfbf" }} />}
        description={
          <Text type="secondary">Select an employee to view their balance details.</Text>
        }
        style={{ padding: "32px 0" }}
      />
    );
  }

  return (
    <Table
      dataSource={balances}
      columns={columns}
      rowKey={(r) => `${r.leaveTypeCode}-${r.year}`}
      loading={loading}
      size="small"
      pagination={{ pageSize: 30, showSizeChanger: false }}
      locale={{ emptyText: <Empty description="No balance data" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  );
};

export default BalanceSummaryTable;
