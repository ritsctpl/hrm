"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Select,
  Segmented,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined, FileSearchOutlined } from "@ant-design/icons";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { useLeaveTypeOptions } from "../../hooks/useLeaveTypeOptions";
import { LeaveRegisterRow, LeaveRegisterRequest } from "../../types/api.types";
import { buildYearOptions } from "../../utils/transformations";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type RegisterFormat = "FORM_14" | "FORM_8" | "CUSTOM";

const FORMAT_OPTIONS = [
  { label: "Form 14 (Factories Act)", value: "FORM_14" as const },
  { label: "Form 8 (Shops & Est.)", value: "FORM_8" as const },
  { label: "Custom", value: "CUSTOM" as const },
];

interface LeaveRegisterPanelProps {
  organizationId: string;
}

const LeaveRegisterPanel: React.FC<LeaveRegisterPanelProps> = ({
  organizationId,
}) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => buildYearOptions(currentYear), [currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedFormat, setSelectedFormat] = useState<RegisterFormat>("FORM_14");
  const [rows, setRows] = useState<LeaveRegisterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);

  // Employee + Leave type dropdowns
  const { options: employeeOptions, employees } = useEmployeeOptions();
  const { options: leaveTypeOptions } = useLeaveTypeOptions();

  // Unique departments from loaded data
  const departmentOptions = useMemo(() => {
    const depts = Array.from(new Set(rows.map(r => r.department).filter(Boolean)));
    return depts.map(d => ({ value: d, label: d }));
  }, [rows]);

  const buildPayload = (): LeaveRegisterRequest => ({
    organizationId,
    year: selectedYear,
    format: selectedFormat,
  });

  const fetchData = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await HrmLeaveService.getLeaveRegister(buildPayload());
      // Enrich: resolve employee name/dept from directory when backend returns UUID
      const enriched = (Array.isArray(data) ? data : []).map(row => {
        const emp = employees.find(e =>
          e.handle === row.employeeNumber ||
          e.employeeCode === row.employeeNumber
        );
        return {
          ...row,
          employeeName: row.employeeName || (emp ? emp.fullName : row.employeeNumber),
          employeeNumber: emp?.employeeCode || row.employeeNumber,
          department: row.department || emp?.department || "",
          designation: row.designation || (emp as unknown as Record<string, string>)?.role || "",
        };
      });
      setRows(enriched);
    } catch {
      // Backend endpoint may not be implemented yet — show empty
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount and when year/format changes
  useEffect(() => {
    fetchData();
  }, [organizationId, selectedYear, selectedFormat]);

  // Client-side filtering
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (employeeFilter && r.employeeNumber !== employeeFilter && r.employeeName !== employeeFilter) return false;
      if (leaveTypeFilter && r.leaveTypeCode !== leaveTypeFilter) return false;
      if (departmentFilter && r.department !== departmentFilter) return false;
      return true;
    });
  }, [rows, employeeFilter, leaveTypeFilter, departmentFilter]);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (exportFormat: "CSV" | "XLSX") => {
    const setter = exportFormat === "CSV" ? setExportingCsv : setExportingXlsx;
    try {
      setter(true);
      const blob = await HrmLeaveService.exportLeaveRegister(buildPayload());
      triggerDownload(
        blob,
        `leave-register-${selectedYear}.${exportFormat.toLowerCase()}`
      );
      message.success(`Leave register ${exportFormat} downloaded`);
    } catch {
      message.error(`Failed to export leave register as ${exportFormat}`);
    } finally {
      setter(false);
    }
  };

  const renderCell = (value: number) =>
    value === 0 ? <Text type="secondary">&mdash;</Text> : value.toFixed(1);

  const columns: ColumnsType<LeaveRegisterRow> = [
    {
      title: "Emp#",
      dataIndex: "employeeNumber",
      key: "employeeNumber",
      fixed: "left",
      width: 90,
    },
    {
      title: "Name",
      dataIndex: "employeeName",
      key: "employeeName",
      fixed: "left",
      width: 160,
    },
    {
      title: "Dept",
      dataIndex: "department",
      key: "department",
      width: 120,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      width: 130,
    },
    {
      title: "Type",
      dataIndex: "leaveTypeCode",
      key: "leaveTypeCode",
      width: 100,
    },
    {
      title: "OB",
      dataIndex: "openingBalance",
      key: "openingBalance",
      width: 60,
      align: "right",
      render: renderCell,
    },
    ...MONTH_LABELS.map((month, idx) => ({
      title: month,
      key: `month_${idx}`,
      width: 55,
      align: "right" as const,
      render: (_: unknown, record: LeaveRegisterRow) =>
        renderCell(record.monthlyAvailed?.[idx] ?? 0),
    })),
    {
      title: "Total",
      dataIndex: "totalAvailed",
      key: "totalAvailed",
      width: 65,
      align: "right",
      render: renderCell,
    },
    {
      title: "Closing",
      dataIndex: "closingBalance",
      key: "closingBalance",
      width: 70,
      align: "right",
      render: renderCell,
    },
    {
      title: "C/F",
      dataIndex: "carryForward",
      key: "carryForward",
      width: 55,
      align: "right",
      render: renderCell,
    },
    {
      title: "Encash",
      dataIndex: "encashed",
      key: "encashed",
      width: 65,
      align: "right",
      render: renderCell,
    },
    {
      title: "Lapsed",
      dataIndex: "lapsed",
      key: "lapsed",
      width: 65,
      align: "right",
      render: renderCell,
    },
  ];

  // Summary row
  const summaryRow = useMemo(() => {
    if (filteredRows.length === 0) return null;
    const monthlyTotals = Array.from({ length: 12 }, (_, idx) =>
      filteredRows.reduce((sum, r) => sum + (r.monthlyAvailed?.[idx] ?? 0), 0)
    );
    return {
      openingBalance: filteredRows.reduce((s, r) => s + (r.openingBalance || 0), 0),
      monthlyTotals,
      totalAvailed: filteredRows.reduce((s, r) => s + (r.totalAvailed || 0), 0),
      closingBalance: filteredRows.reduce((s, r) => s + (r.closingBalance || 0), 0),
      carryForward: filteredRows.reduce((s, r) => s + (r.carryForward || 0), 0),
      encashed: filteredRows.reduce((s, r) => s + (r.encashed || 0), 0),
      lapsed: filteredRows.reduce((s, r) => s + (r.lapsed || 0), 0),
    };
  }, [filteredRows]);

  return (
    <div className={styles.leaveRegisterPanel}>
      <Title level={5}>Leave Register (Statutory)</Title>

      {/* Controls: Year, Format, Actions */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Space align="center">
            <Text strong>Year:</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              style={{ width: 100 }}
              size="small"
            />
          </Space>

          <Segmented
            options={FORMAT_OPTIONS}
            value={selectedFormat}
            onChange={(val) => setSelectedFormat(val as RegisterFormat)}
            size="small"
          />

          <Can I="view" object="leave_report" passIf={true}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport("CSV")}
              loading={exportingCsv}
              disabled={filteredRows.length === 0}
              size="small"
            >
              Export CSV
            </Button>
          </Can>

          <Can I="view" object="leave_report" passIf={true}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport("XLSX")}
              loading={exportingXlsx}
              disabled={filteredRows.length === 0}
              size="small"
            >
              Export XLSX
            </Button>
          </Can>
        </div>
      </Card>

      {/* Filters: Employee, Leave Type, Department */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Select
          showSearch
          allowClear
          placeholder="Filter by Employee"
          value={employeeFilter}
          onChange={setEmployeeFilter}
          options={employeeOptions}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: 220 }}
          size="small"
        />
        <Select
          allowClear
          placeholder="Filter by Leave Type"
          value={leaveTypeFilter}
          onChange={setLeaveTypeFilter}
          options={leaveTypeOptions}
          style={{ width: 180 }}
          size="small"
        />
        <Select
          allowClear
          placeholder="Filter by Department"
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={departmentOptions}
          style={{ width: 180 }}
          size="small"
        />
        {(employeeFilter || leaveTypeFilter || departmentFilter) && (
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEmployeeFilter(undefined);
              setLeaveTypeFilter(undefined);
              setDepartmentFilter(undefined);
            }}
          >
            Clear Filters
          </Button>
        )}
        <Text type="secondary" style={{ fontSize: 12, lineHeight: "24px" }}>
          {filteredRows.length} of {rows.length} records
        </Text>
      </div>

      <Table<LeaveRegisterRow>
        dataSource={filteredRows}
        columns={columns}
        rowKey={(record) =>
          `${record.employeeNumber}-${record.leaveTypeCode}`
        }
        size="small"
        loading={loading}
        pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: ["25", "50", "100"] }}
        scroll={{ x: 1800 }}
        bordered
        summary={() =>
          summaryRow ? (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>Totals</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
                <Table.Summary.Cell index={3} />
                <Table.Summary.Cell index={4} />
                <Table.Summary.Cell index={5} align="right">
                  <Text strong>{summaryRow.openingBalance.toFixed(1)}</Text>
                </Table.Summary.Cell>
                {summaryRow.monthlyTotals.map((val, idx) => (
                  <Table.Summary.Cell key={idx} index={6 + idx} align="right">
                    <Text strong>
                      {val === 0 ? "\u2014" : val.toFixed(1)}
                    </Text>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={18} align="right">
                  <Text strong>{summaryRow.totalAvailed.toFixed(1)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={19} align="right">
                  <Text strong>{summaryRow.closingBalance.toFixed(1)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={20} align="right">
                  <Text strong>{summaryRow.carryForward.toFixed(1)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={21} align="right">
                  <Text strong>{summaryRow.encashed.toFixed(1)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={22} align="right">
                  <Text strong>{summaryRow.lapsed.toFixed(1)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          ) : null
        }
      />
    </div>
  );
};

export default LeaveRegisterPanel;
