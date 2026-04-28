"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useLeaveTypeOptions } from "../../hooks/useLeaveTypeOptions";
import { useEmployeeOptions } from "../../hooks/useEmployeeOptions";
import { LedgerHistoryResponse } from "../../types/api.types";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title } = Typography;

const DEFAULT_PAGE_SIZE = 10;

interface LeaveAvailedReportPanelProps {
  organizationId: string;
}

interface FormValues {
  dateRange: [Dayjs, Dayjs];
  employeeId?: string;
  leaveTypeCode?: string;
  department?: string;
}

const LeaveAvailedReportPanel: React.FC<LeaveAvailedReportPanelProps> = ({ organizationId }) => {
  // Default range: last 90 days up to today — wide enough to seed the table
  // but bounded enough that a fresh mount doesn't dump the entire ledger.
  const defaultRange: [Dayjs, Dayjs] = React.useMemo(
    () => [dayjs().subtract(90, "day"), dayjs()],
    [],
  );
  const [form] = Form.useForm<FormValues>();
  const [rows, setRows] = useState<LedgerHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { options: leaveTypeOptions, loading: leaveTypeOptionsLoading } = useLeaveTypeOptions();
  const { options: employeeSelectOptions, employees, loading: employeesLoading } = useEmployeeOptions();

  // Build department options from employee directory
  const departmentOptions = React.useMemo(() => {
    const depts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
    return depts.map(d => ({ value: d, label: d }));
  }, [employees]);

  const buildPayload = (values: FormValues) => {
    const [from, to] = values.dateRange;
    return {
      organizationId,
      fromDate: from.format("YYYY-MM-DD"),
      toDate: to.format("YYYY-MM-DD"),
      leaveTypeCode: values.leaveTypeCode || undefined,
    };
  };

  const handleGenerate = async (opts: { silent?: boolean } = {}) => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const data = await HrmLeaveService.getLeaveAvailedReport(buildPayload(values));
      setRows(Array.isArray(data) ? data : []);
      if (!opts.silent) {
        message.success(`Loaded ${data?.length ?? 0} rows`);
      }
    } catch {
      if (!opts.silent) {
        message.error("Failed to generate report");
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount with the default 90-day range so the table isn't
  // blank. Table pagination caps visible rows at DEFAULT_PAGE_SIZE (50).
  const didInitialLoad = useRef(false);
  useEffect(() => {
    if (didInitialLoad.current || !organizationId) return;
    didInitialLoad.current = true;
    form.setFieldsValue({ dateRange: defaultRange });
    handleGenerate({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      setExporting(true);
      const [from, to] = values.dateRange;
      const blob = await HrmLeaveService.exportLeaveReport({ organizationId,
        reportType: "LEAVE_AVAILED",
        fromDate: from.format("YYYY-MM-DD"),
        toDate: to.format("YYYY-MM-DD"),
        leaveTypeCode: values.leaveTypeCode || undefined,
        deptId: values.department || undefined,
        format: "CSV",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leave-availed-${from.format("YYYY-MM-DD")}-to-${to.format("YYYY-MM-DD")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("Report CSV downloaded");
    } catch {
      message.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  /** Resolve createdBy (UUID or literal like "system") to a readable name */
  const resolveEmployee = (createdBy: string) => {
    if (!createdBy) return "—";
    const emp = employees.find((e) => e.handle === createdBy);
    if (emp) return `${emp.employeeCode} - ${emp.fullName}`;
    // Capitalise non-UUID literals like "system" → "System"
    return createdBy.charAt(0).toUpperCase() + createdBy.slice(1);
  };

  const columns: ColumnsType<LedgerHistoryResponse> = [
    {
      title: "Employee",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (v: string) => resolveEmployee(v),
    },
    { title: "Leave Type", dataIndex: "leaveTypeName", key: "leaveTypeName" },
    { title: "Txn Date", dataIndex: "transactionDate", key: "transactionDate", width: 120 },
    {
      title: "Days",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (v: number, row) => (
        <Tag color={row.direction === "CR" ? "green" : "red"}>
          {row.direction === "CR" ? "+" : "-"}
          {v}
        </Tag>
      ),
    },
    { title: "Reason", dataIndex: "reasonCode", key: "reasonCode" },
    { title: "Notes", dataIndex: "notes", key: "notes" },
    {
      title: "Ref",
      dataIndex: "refType",
      key: "refType",
      width: 110,
      render: (v: string) => <Tag>{v}</Tag>,
    },
  ];

  return (
    <div className={styles.leaveAvailedReport}>
      <Title level={5}>Leave Availed Report</Title>

      <Card size="small" style={{ marginBottom: 12 }} styles={{ body: { padding: 10 } }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ dateRange: defaultRange }}
          style={{ display: "flex", flexWrap: "wrap", gap: 8, rowGap: 8 }}
        >
          <Form.Item name="dateRange" rules={[{ required: true, message: "" }]} style={{ margin: 0 }}>
            <DatePicker.RangePicker format="DD-MMM-YYYY" size="small" />
          </Form.Item>
          <Form.Item name="employeeId" style={{ margin: 0 }}>
            <Select
              showSearch
              allowClear
              size="small"
              options={employeeSelectOptions}
              loading={employeesLoading}
              style={{ width: 200 }}
              placeholder="All employees"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="leaveTypeCode" style={{ margin: 0 }}>
            <Select
              showSearch
              allowClear
              size="small"
              options={leaveTypeOptions}
              loading={leaveTypeOptionsLoading}
              style={{ width: 160 }}
              placeholder="All leave types"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="department" style={{ margin: 0 }}>
            <Select
              showSearch
              allowClear
              size="small"
              options={departmentOptions}
              style={{ width: 160 }}
              placeholder="All departments"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item style={{ margin: 0 }}>
            <Space size={6}>
              <Can I="view" object="leave_report" passIf={true}>
                <Button type="primary" size="small" onClick={() => handleGenerate()} loading={loading}>
                  Generate
                </Button>
              </Can>
              <Can I="view" object="leave_report" passIf={true}>
                <Button size="small" onClick={handleExport} loading={exporting}>
                  Export CSV
                </Button>
              </Can>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Table
        dataSource={rows}
        columns={columns}
        rowKey="handle"
        size="small"
        loading={loading}
        pagination={{
          current,
          pageSize,
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
      />
    </div>
  );
};

export default LeaveAvailedReportPanel;
