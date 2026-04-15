"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { LedgerHistoryResponse } from "../../types/api.types";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title } = Typography;

const LEAVE_TYPE_OPTIONS = [
  { value: "CL", label: "Casual Leave" },
  { value: "SL", label: "Sick Leave" },
  { value: "PL", label: "Privilege Leave" },
  { value: "CO", label: "Comp Off" },
  { value: "WFH", label: "Work From Home" },
];

interface LeaveAvailedReportPanelProps {
  site: string;
}

interface FormValues {
  dateRange: [Dayjs, Dayjs];
  employeeId?: string;
  leaveTypeCode?: string;
  department?: string;
}

const LeaveAvailedReportPanel: React.FC<LeaveAvailedReportPanelProps> = ({ site }) => {
  const [form] = Form.useForm<FormValues>();
  const [rows, setRows] = useState<LedgerHistoryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const buildPayload = (values: FormValues) => {
    const [from, to] = values.dateRange;
    return {
      site,
      fromDate: from.format("YYYY-MM-DD"),
      toDate: to.format("YYYY-MM-DD"),
      leaveTypeCode: values.leaveTypeCode || undefined,
    };
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const data = await HrmLeaveService.getLeaveAvailedReport(buildPayload(values));
      setRows(Array.isArray(data) ? data : []);
      message.success(`Loaded ${data?.length ?? 0} rows`);
    } catch {
      message.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      setExporting(true);
      const [from, to] = values.dateRange;
      const blob = await HrmLeaveService.exportLeaveReport({
        site,
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

  const columns: ColumnsType<LedgerHistoryResponse> = [
    { title: "Employee", dataIndex: "createdBy", key: "createdBy" },
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

      <Card size="small" style={{ marginBottom: 12 }}>
        <Form form={form} layout="inline" style={{ rowGap: 12 }}>
          <Form.Item name="dateRange" label="Date Range" rules={[{ required: true }]}>
            <DatePicker.RangePicker format="DD-MMM-YYYY" />
          </Form.Item>
          <Form.Item name="employeeId" label="Employee">
            <Input placeholder="Optional" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="leaveTypeCode" label="Leave Type">
            <Select
              allowClear
              options={LEAVE_TYPE_OPTIONS}
              style={{ width: 180 }}
              placeholder="All types"
            />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input placeholder="Optional" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Can I="view" object="leave_report">
                <Button type="primary" onClick={handleGenerate} loading={loading}>
                  Generate
                </Button>
              </Can>
              <Can I="view" object="leave_report">
                <Button onClick={handleExport} loading={exporting}>
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
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default LeaveAvailedReportPanel;
