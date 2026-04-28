"use client";

import React, { useMemo, useState } from "react";
import { Table, Empty, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { InfoCircleOutlined } from "@ant-design/icons";
import { BalanceSummaryTableProps } from "../../types/ui.types";
import { LeaveBalance } from "../../types/domain.types";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";

const { Text } = Typography;

const BalanceSummaryTable: React.FC<BalanceSummaryTableProps> = ({
  balances,
  loading,
  onRowClick,
  selectedEmployeeId,
}) => {
  const { employees } = useEmployeeOptions();
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Index directory once so we can fall back to it when the backend
  // response omits employee name / department (common today).
  const directoryIndex = useMemo(() => {
    const byHandle = new Map<string, { name: string; code: string; department: string }>();
    employees.forEach((e) => {
      byHandle.set(e.handle, {
        name: e.fullName,
        code: e.employeeCode,
        department: e.department ?? "",
      });
    });
    return byHandle;
  }, [employees]);

  // Filter + enrich rows. Attach a stable __idx so each row gets a unique
  // rowKey even when backend omits employeeId (duplicate keys were causing
  // pagination slicing to misbehave — rows from previous pages bled into
  // later pages because React reused their DOM nodes).
  const enriched = useMemo(() => {
    const rows = selectedEmployeeId
      ? balances.filter((b) => !b.employeeId || b.employeeId === selectedEmployeeId)
      : balances;

    return rows.map((row, idx) => {
      const resolved = row.employeeId ? directoryIndex.get(row.employeeId) : undefined;
      return {
        ...row,
        __idx: idx,
        employeeName: row.employeeName?.trim() || resolved?.name || "",
        employeeNumber: row.employeeNumber?.trim() || resolved?.code || "",
        department: row.department?.trim() || resolved?.department || "",
      };
    });
  }, [balances, selectedEmployeeId, directoryIndex]);

  // Manual pagination slice — defence against AntD internal slicing bugs
  // when duplicate keys or rapid re-renders are in play.
  const pagedData = useMemo(() => {
    const start = (current - 1) * pageSize;
    return enriched.slice(start, start + pageSize);
  }, [enriched, current, pageSize]);

  // Show Employee / Department columns when no filter is set (rows may
  // belong to many employees). Hide when one employee is selected.
  const showEmployeeColumns = !selectedEmployeeId;

  const columns: ColumnsType<LeaveBalance> = [
    ...(showEmployeeColumns
      ? [
          {
            title: "Employee",
            key: "employee",
            render: (_: unknown, record: LeaveBalance) => {
              const name = record.employeeName || "";
              const code = record.employeeNumber || "";
              const display = name || code || "—";
              return (
                <div>
                  <Text strong style={{ fontSize: 12 }}>
                    {display}
                  </Text>
                  {name && code && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {code}
                      </Text>
                    </>
                  )}
                </div>
              );
            },
          } as const,
          {
            title: "Department",
            dataIndex: "department",
            key: "department",
            width: 140,
            render: (v: string) => v || <Text type="secondary">—</Text>,
          } as const,
        ]
      : []),
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

  if (!selectedEmployeeId && !loading && enriched.length === 0) {
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
      dataSource={pagedData}
      columns={columns}
      rowKey={(r) =>
        // __idx guarantees uniqueness even when employeeId is missing and
        // multiple rows share leaveType+year.
        `${(r as unknown as { __idx: number }).__idx}-${r.leaveTypeCode}-${r.year}`
      }
      loading={loading}
      size="small"
      pagination={{
        current,
        pageSize,
        total: enriched.length,
        pageSizeOptions: ["10", "25", "50", "100"],
        showSizeChanger: true,
        showTotal: (total, range) =>
          total === 0 ? "0 records" : `${range[0]}–${range[1]} of ${total}`,
        onChange: (newPage, newSize) => {
          // Size changed → always jump to page 1. This avoids a stale
          // `current` that would fall outside the new page count.
          if (newSize !== pageSize) {
            setPageSize(newSize);
            setCurrent(1);
          } else {
            setCurrent(newPage);
          }
        },
      }}
      locale={{ emptyText: <Empty description="No balance data" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
    />
  );
};

export default BalanceSummaryTable;
