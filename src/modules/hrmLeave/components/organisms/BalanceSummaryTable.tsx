"use client";

import React, { useMemo, useState } from "react";
import { Table, Empty, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { InfoCircleOutlined } from "@ant-design/icons";
import { BalanceSummaryTableProps } from "../../types/ui.types";
import { LeaveBalance } from "../../types/domain.types";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";

const { Text } = Typography;

interface EmployeeGroup {
  key: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  available: number;
  usedYTD: number;
  pending: number;
  current: number;
  typeCount: number;
  rows: LeaveBalance[];
}

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

  // Show Employee / Department columns when no filter is set (rows may
  // belong to many employees). Hide when one employee is selected.
  const showEmployeeColumns = !selectedEmployeeId;

  // Item 7: when no employee is picked, consolidate the per-leave-type
  // rows into one row per employee with summed totals + an expandable
  // detail of the per-type figures. The single-employee view keeps the
  // flat per-type table because there's no duplication to collapse.
  const employeeGroups = useMemo<EmployeeGroup[]>(() => {
    if (selectedEmployeeId) return [];
    const map = new Map<string, EmployeeGroup>();
    for (const row of enriched) {
      const id =
        row.employeeId ||
        row.employeeNumber ||
        `${row.employeeName}|${row.department}` ||
        `row-${(row as unknown as { __idx: number }).__idx}`;
      let group = map.get(id);
      if (!group) {
        group = {
          key: id,
          employeeId: row.employeeId || "",
          employeeName: row.employeeName || "",
          employeeNumber: row.employeeNumber || "",
          department: row.department || "",
          available: 0,
          usedYTD: 0,
          pending: 0,
          current: 0,
          typeCount: 0,
          rows: [],
        };
        map.set(id, group);
      }
      group.available += Number(row.availableBalance) || 0;
      group.usedYTD += Number(row.ytdDebits) || 0;
      group.pending += Number(row.pendingApproval) || 0;
      group.current += Number(row.currentBalance) || 0;
      group.typeCount += 1;
      group.rows.push(row);
    }
    return Array.from(map.values());
  }, [enriched, selectedEmployeeId]);

  const pagedFlat = useMemo(() => {
    const start = (current - 1) * pageSize;
    return enriched.slice(start, start + pageSize);
  }, [enriched, current, pageSize]);

  const pagedGroups = useMemo(() => {
    const start = (current - 1) * pageSize;
    return employeeGroups.slice(start, start + pageSize);
  }, [employeeGroups, current, pageSize]);

  // Inner per-leave-type table rendered when an employee group is expanded
  // in the consolidated view (item 7).
  const innerLeaveTypeColumns: ColumnsType<LeaveBalance> = [
    { title: "Leave Type", dataIndex: "leaveTypeName", key: "leaveTypeName" },
    { title: "Code", dataIndex: "leaveTypeCode", key: "leaveTypeCode", width: 70 },
    {
      title: "Available",
      dataIndex: "availableBalance",
      key: "available",
      width: 100,
      render: (v: number) => (Number(v) || 0).toFixed(1),
      align: "right",
    },
    {
      title: "Used YTD",
      dataIndex: "ytdDebits",
      key: "ytdDebits",
      width: 100,
      render: (v: number) => (Number(v) || 0).toFixed(1),
      align: "right",
    },
    {
      title: "Pending",
      dataIndex: "pendingApproval",
      key: "pendingApproval",
      width: 90,
      render: (v: number) => (Number(v) || 0).toFixed(1),
      align: "right",
    },
    {
      title: "Current",
      dataIndex: "currentBalance",
      key: "currentBalance",
      width: 100,
      render: (v: number) => (Number(v) || 0).toFixed(1),
      align: "right",
    },
    {
      title: "CF",
      dataIndex: "carryForwardAllowed",
      key: "cf",
      width: 60,
      render: (v: boolean) => (v ? "Yes" : "No"),
    },
  ];

  // Single-employee view: keep the flat per-leave-type table.
  const flatColumns: ColumnsType<LeaveBalance> = [
    { title: "Leave Type", dataIndex: "leaveTypeName", key: "leaveTypeName" },
    { title: "Code", dataIndex: "leaveTypeCode", key: "leaveTypeCode", width: 60 },
    {
      title: "Available",
      dataIndex: "availableBalance",
      key: "available",
      width: 90,
      render: (v: number) => (Number(v) || 0).toFixed(1),
      align: "right",
    },
    {
      title: "Used YTD",
      dataIndex: "ytdDebits",
      key: "ytdDebits",
      width: 90,
      render: (v: number) => (Number(v) || 0).toFixed(1),
      align: "right",
    },
    {
      title: "Pending",
      dataIndex: "pendingApproval",
      key: "pendingApproval",
      width: 80,
      render: (v: number) => (Number(v) || 0).toFixed(1),
      align: "right",
    },
    {
      title: "Current",
      dataIndex: "currentBalance",
      key: "currentBalance",
      width: 90,
      render: (v: number) => (Number(v) || 0).toFixed(1),
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

  // Consolidated (multi-employee) columns — one row per employee.
  const groupColumns: ColumnsType<EmployeeGroup> = [
    {
      title: "Employee",
      key: "employee",
      render: (_: unknown, g: EmployeeGroup) => {
        const display = g.employeeName?.trim() || g.employeeNumber?.trim() || "—";
        return (
          <div>
            <Text strong style={{ fontSize: 12 }}>
              {display}
            </Text>
            {g.employeeName && g.employeeNumber && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {g.employeeNumber}
                </Text>
              </>
            )}
          </div>
        );
      },
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      width: 140,
      render: (v: string) => v?.trim() || <Text type="secondary">—</Text>,
    },
    {
      title: "Available",
      dataIndex: "available",
      key: "available",
      width: 110,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "Used YTD",
      dataIndex: "usedYTD",
      key: "usedYTD",
      width: 100,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "Pending",
      dataIndex: "pending",
      key: "pending",
      width: 90,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "Current",
      dataIndex: "current",
      key: "current",
      width: 100,
      render: (v: number) => v.toFixed(1),
      align: "right",
    },
    {
      title: "Types",
      dataIndex: "typeCount",
      key: "typeCount",
      width: 90,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
      align: "center",
    },
  ];

  if (showEmployeeColumns) {
    // Consolidated employee-wise view (item 7).
    return (
      <Table<EmployeeGroup>
        dataSource={pagedGroups}
        columns={groupColumns}
        rowKey="key"
        loading={loading}
        size="small"
        scroll={{ x: "max-content" }}
        onRow={(record) => ({
          onClick: () => onRowClick?.(record.employeeId),
          style: {
            cursor: onRowClick ? "pointer" : undefined,
            background:
              record.employeeId && record.employeeId === selectedEmployeeId
                ? "#e6f4ff"
                : undefined,
          },
        })}
        expandable={{
          expandedRowRender: (group) => (
            <Table<LeaveBalance>
              dataSource={group.rows}
              columns={innerLeaveTypeColumns}
              rowKey={(r) =>
                `${group.key}-${r.leaveTypeCode}-${r.year}-${
                  (r as unknown as { __idx: number }).__idx
                }`
              }
              size="small"
              pagination={false}
              scroll={{ x: "max-content" }}
            />
          ),
        }}
        pagination={{
          current,
          pageSize,
          total: employeeGroups.length,
          pageSizeOptions: ["10", "25", "50", "100"],
          showSizeChanger: true,
          showTotal: (total, range) =>
            total === 0 ? "0 employees" : `${range[0]}–${range[1]} of ${total}`,
          onChange: (newPage, newSize) => {
            if (newSize !== pageSize) {
              setPageSize(newSize);
              setCurrent(1);
            } else {
              setCurrent(newPage);
            }
          },
        }}
        locale={{
          emptyText: (
            <Empty
              image={<InfoCircleOutlined style={{ fontSize: 36, color: "#bfbfbf" }} />}
              description={
                <Text type="secondary">No balance data — pick a department to filter.</Text>
              }
              style={{ padding: "32px 0" }}
            />
          ),
        }}
      />
    );
  }

  // Single-employee view — flat per-leave-type table.
  return (
    <Table
      dataSource={pagedFlat}
      columns={flatColumns}
      rowKey={(r) =>
        `${(r as unknown as { __idx: number }).__idx}-${r.leaveTypeCode}-${r.year}`
      }
      loading={loading}
      size="small"
      scroll={{ x: "max-content" }}
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
