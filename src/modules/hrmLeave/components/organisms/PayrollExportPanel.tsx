"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Typography,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useLeaveTypeOptions } from "../../hooks/useLeaveTypeOptions";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

interface PayrollExportPanelProps {
  organizationId: string;
}

const PayrollExportPanel: React.FC<PayrollExportPanelProps> = ({ organizationId }) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const [exportForm] = Form.useForm();
  const [lockForm] = Form.useForm();
  const [exporting, setExporting] = useState(false);
  const [locking, setLocking] = useState(false);
  const { options: leaveTypeOptions, loading: leaveTypeOptionsLoading } = useLeaveTypeOptions();

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

  const handleExport = async () => {
    try {
      const values = await exportForm.validateFields();
      const period: Dayjs = values.period;
      const year = period.year();
      const month = period.month() + 1;
      setExporting(true);
      const blob = await HrmLeaveService.exportPayroll({ organizationId,
        year,
        month,
        format: "CSV",
        requestedBy: userId,
      });
      triggerDownload(blob, `payroll-leave-${year}-${month}.csv`);
      message.success("Payroll export downloaded");
    } catch {
      message.error("Failed to export payroll");
    } finally {
      setExporting(false);
    }
  };

  const handleLock = async () => {
    try {
      const values = await lockForm.validateFields();
      const period: Dayjs = values.period;
      const year = period.year();
      const month = period.month() + 1;
      setLocking(true);
      await HrmLeaveService.lockPayrollMonth({ organizationId,
        year,
        month,
        lockedBy: userId,
      });
      message.success(`Payroll locked for ${year}-${String(month).padStart(2, "0")}`);
    } catch {
      message.error("Failed to lock payroll month");
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className={styles.payrollExportPanel}>
      <Title level={5}>Payroll Export</Title>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card size="small" title="Export Payroll CSV">
          <Form
            form={exportForm}
            layout="inline"
            initialValues={{ period: dayjs() }}
            style={{ rowGap: 12 }}
          >
            <Form.Item name="period" label="Period" rules={[{ required: true }]}>
              <DatePicker picker="month" format="MMM YYYY" />
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Input placeholder="Optional dept filter" allowClear style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="leaveTypeCode" label="Leave Type">
              <Select
                showSearch
                allowClear
                options={leaveTypeOptions}
                loading={leaveTypeOptionsLoading}
                style={{ width: 180 }}
                placeholder="All types"
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item>
              <Can I="view" object="leave_payroll_export" passIf={true}>
                <Button type="primary" loading={exporting} onClick={handleExport}>
                  Export CSV
                </Button>
              </Can>
            </Form.Item>
          </Form>
        </Card>

        <Card size="small" title="Lock Payroll Month">
          <Text type="secondary">
            Locking a month prevents further ledger changes for that period.
          </Text>
          <Form
            form={lockForm}
            layout="inline"
            initialValues={{ period: dayjs() }}
            style={{ marginTop: 12 }}
          >
            <Form.Item name="period" label="Period" rules={[{ required: true }]}>
              <DatePicker picker="month" format="MMM YYYY" />
            </Form.Item>
            <Form.Item>
              <Can I="add" object="leave_payroll_lock" passIf={true}>
                <Popconfirm
                  title="Lock this payroll month?"
                  description="This cannot be easily undone."
                  onConfirm={handleLock}
                  okText="Lock"
                  cancelText="Cancel"
                >
                  <Button danger loading={locking}>
                    Lock Month
                  </Button>
                </Popconfirm>
              </Can>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
};

export default PayrollExportPanel;
