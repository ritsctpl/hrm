"use client";

import React, { useState, useMemo } from "react";
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

  const buildPayload = (): LeaveRegisterRequest => ({
    organizationId,
    year: selectedYear,
    format: selectedFormat,
  });

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const data = await HrmLeaveService.getLeaveRegister(buildPayload());
      setRows(Array.isArray(data) ? data : []);
      message.success(`Loaded ${data?.length ?? 0} rows`);
    } catch {
      message.error("Failed to generate leave register");
    } finally {
      setLoading(false);
    }
  };

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
      width: 70,
    },
    {
      title: "OB",
      dataIndex: "openingBalance",
      key: "openingBalance",
      width: 70,
      align: "right",
      render: renderCell,
    },
    ...MONTH_LABELS.map((month, idx) => ({
      title: month,
      key: `month_${idx}`,
      width: 60,
      align: "right" as const,
      render: (_: unknown, record: LeaveRegisterRow) =>
        renderCell(record.monthlyAvailed?.[idx] ?? 0),
    })),
    {
      title: "Total",
      dataIndex: "totalAvailed",
      key: "totalAvailed",
      width: 70,
      align: "right",
      render: renderCell,
    },
    {
      title: "Closing",
      dataIndex: "closingBalance",
      key: "closingBalance",
      width: 80,
      align: "right",
      render: renderCell,
    },
    {
      title: "C/F",
      dataIndex: "carryForward",
      key: "carryForward",
      width: 70,
      align: "right",
      render: renderCell,
    },
    {
      title: "Encash",
      dataIndex: "encashed",
      key: "encashed",
      width: 80,
      align: "right",
      render: renderCell,
    },
    {
      title: "Lapsed",
      dataIndex: "lapsed",
      key: "lapsed",
      width: 80,
      align: "right",
      render: renderCell,
    },
  ];

  // Build summary row
  const summaryRow = useMemo(() => {
    if (rows.length === 0) return null;
    const monthlyTotals = Array.from({ length: 12 }, (_, idx) =>
      rows.reduce((sum, r) => sum + (r.monthlyAvailed?.[idx] ?? 0), 0)
    );
    return {
      openingBalance: rows.reduce((s, r) => s + r.openingBalance, 0),
      monthlyTotals,
      totalAvailed: rows.reduce((s, r) => s + r.totalAvailed, 0),
      closingBalance: rows.reduce((s, r) => s + r.closingBalance, 0),
      carryForward: rows.reduce((s, r) => s + r.carryForward, 0),
      encashed: rows.reduce((s, r) => s + r.encashed, 0),
      lapsed: rows.reduce((s, r) => s + r.lapsed, 0),
    };
  }, [rows]);

  return (
    <div className={styles.leaveRegisterPanel}>
      <Title level={5}>Leave Register (Statutory)</Title>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap size="middle" align="center">
          <Space align="center">
            <Text strong>Year:</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={yearOptions}
              style={{ width: 100 }}
            />
          </Space>

          <Space align="center">
            <Text strong>Format:</Text>
            <Segmented
              options={FORMAT_OPTIONS}
              value={selectedFormat}
              onChange={(val) => setSelectedFormat(val as RegisterFormat)}
            />
          </Space>

          <Can I="view" object="leave_report" passIf={true}>
            <Button
              type="primary"
              icon={<FileSearchOutlined />}
              onClick={handleGenerate}
              loading={loading}
            >
              Generate
            </Button>
          </Can>

          <Can I="view" object="leave_report" passIf={true}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport("CSV")}
              loading={exportingCsv}
              disabled={rows.length === 0}
            >
              Export CSV
            </Button>
          </Can>

          <Can I="view" object="leave_report" passIf={true}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport("XLSX")}
              loading={exportingXlsx}
              disabled={rows.length === 0}
            >
              Export XLSX
            </Button>
          </Can>
        </Space>
      </Card>

      <Table<LeaveRegisterRow>
        dataSource={rows}
        columns={columns}
        rowKey={(record) =>
          `${record.employeeNumber}-${record.leaveTypeCode}`
        }
        size="small"
        loading={loading}
        pagination={{ pageSize: 50, showSizeChanger: true }}
        scroll={{ x: 1800 }}
        summary={() =>
          summaryRow ? (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>Totals</Text>
                </Table.Summary.Cell>
                {/* Dept */}
                <Table.Summary.Cell index={2} />
                {/* Designation */}
                <Table.Summary.Cell index={3} />
                {/* Type */}
                <Table.Summary.Cell index={4} />
                {/* OB */}
                <Table.Summary.Cell index={5} align="right">
                  <Text strong>{summaryRow.openingBalance.toFixed(1)}</Text>
                </Table.Summary.Cell>
                {/* 12 months */}
                {summaryRow.monthlyTotals.map((val, idx) => (
                  <Table.Summary.Cell key={idx} index={6 + idx} align="right">
                    <Text strong>
                      {val === 0 ? "\u2014" : val.toFixed(1)}
                    </Text>
                  </Table.Summary.Cell>
                ))}
                {/* Total */}
                <Table.Summary.Cell index={18} align="right">
                  <Text strong>{summaryRow.totalAvailed.toFixed(1)}</Text>
                </Table.Summary.Cell>
                {/* Closing */}
                <Table.Summary.Cell index={19} align="right">
                  <Text strong>{summaryRow.closingBalance.toFixed(1)}</Text>
                </Table.Summary.Cell>
                {/* C/F */}
                <Table.Summary.Cell index={20} align="right">
                  <Text strong>{summaryRow.carryForward.toFixed(1)}</Text>
                </Table.Summary.Cell>
                {/* Encash */}
                <Table.Summary.Cell index={21} align="right">
                  <Text strong>{summaryRow.encashed.toFixed(1)}</Text>
                </Table.Summary.Cell>
                {/* Lapsed */}
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
