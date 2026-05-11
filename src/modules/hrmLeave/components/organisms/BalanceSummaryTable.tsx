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
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Backend was supposed to start returning populated employeeName /
  // employeeNumber / department on each balance row, but in practice the
  // values come through blank for many records — so the Balance Summary
  // table rendered empty Employee + Department cells. Pull the employee
  // directory once and use it as a fallback enrichment source. Keys are
  // the composite "EMP-2 - Name" (what leave-service stores in
  // employeeId), the raw code, and the handle UUID — leave-service is
  // inconsistent about which one it returns on balance rows.
  const { employees } = useEmployeeOptions();
  const employeeLookup = useMemo(() => {
    const map = new Map<string, { name: string; code: string; department: string }>();
    for (const emp of employees) {
      const entry = {
        name: emp.fullName || "",
        code: emp.employeeCode || "",
        department: emp.department || "",
      };
      const composite =
        emp.employeeCode && emp.fullName
          ? `${emp.employeeCode} - ${emp.fullName}`
          : "";
      if (composite) map.set(composite, entry);
      if (emp.employeeCode) map.set(emp.employeeCode, entry);
      if (emp.handle) map.set(emp.handle, entry);
    }
    return map;
  }, [employees]);

  // Filter rows for the selected employee, then layer the directory
  // lookup over each row so blanks in employeeName / employeeNumber /
  // department get filled where possible. __idx keeps rowKey unique
  // even when two rows share leaveType+year (AntD pagination bleed).
  const enriched = useMemo(() => {
    const rows = selectedEmployeeId
      ? balances.filter((b) => !b.employeeId || b.employeeId === selectedEmployeeId)
      : balances;
    return rows.map((row, idx) => {
      const fallback = row.employeeId ? employeeLookup.get(row.employeeId) : undefined;
      return {
        ...row,
        employeeName: row.employeeName?.trim() || fallback?.name || "",
        employeeNumber: row.employeeNumber?.trim() || fallback?.code || "",
        department: row.department?.trim() || fallback?.department || "",
        __idx: idx,
      };
    });
  }, [balances, selectedEmployeeId, employeeLookup]);

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
              const name = record.employeeName?.trim() || "";
              const code = record.employeeNumber?.trim() || "";
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
            render: (v: string) => v?.trim() || <Text type="secondary">—</Text>,
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
