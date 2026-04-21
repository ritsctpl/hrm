"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  List,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { parseCookies } from "nookies";
import axios from "axios";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useHrmLeaveStore } from "../../stores/hrmLeaveStore";
import { AccrualRunPanelProps } from "../../types/ui.types";
import { AccrualBatch } from "../../types/api.types";
import AccrualPreviewLine from "../molecules/AccrualPreviewLine";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

// ── Period type definitions ─────────────────────────────────────────

type PeriodType = "MONTHLY" | "QUARTERLY" | "ANNUAL";

type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

const QUARTER_OPTIONS: { value: Quarter; label: string }[] = [
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
];

// Quarter → start month (0-indexed). End is start+2, last day.
const QUARTER_START_MONTH: Record<Quarter, number> = {
  Q1: 0,
  Q2: 3,
  Q3: 6,
  Q4: 9,
};

const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const MONTH_NAMES: Record<number, string> = {
  1: "January", 2: "February", 3: "March", 4: "April",
  5: "May", 6: "June", 7: "July", 8: "August",
  9: "September", 10: "October", 11: "November", 12: "December",
};

const getQuarterPeriod = (
  quarter: Quarter,
  year: number,
): { start: Dayjs; end: Dayjs } => {
  const startMonth = QUARTER_START_MONTH[quarter];
  const start = dayjs(new Date(year, startMonth, 1));
  const end = start.add(2, "month").endOf("month");
  return { start, end };
};

const getMonthPeriod = (
  month: number,
  year: number,
): { start: Dayjs; end: Dayjs } => {
  const start = dayjs(new Date(year, month - 1, 1));
  const end = start.endOf("month");
  return { start, end };
};

const getAnnualPeriod = (
  year: number,
): { start: Dayjs; end: Dayjs } => {
  const start = dayjs(new Date(year, 0, 1));
  const end = dayjs(new Date(year, 11, 31));
  return { start, end };
};

/**
 * Converts a batch's `quarter` field into a human-readable display string.
 * Monthly batches use "M01"–"M12", annual uses "ANNUAL", quarterly uses "Q1"–"Q4".
 */
const formatBatchQuarter = (quarter: string, year: number): string => {
  if (quarter === "ANNUAL") return `Annual ${year}`;
  const monthMatch = quarter.match(/^M(\d{2})$/);
  if (monthMatch) {
    const monthNum = Number(monthMatch[1]);
    return `${MONTH_NAMES[monthNum] ?? quarter} ${year}`;
  }
  return `${quarter} ${year}`;
};

// Best-effort backend error extraction: prefers the HRM envelope `message`
// or a validation `errors[]` payload, falls back to axios .message, then
// a generic string.
const extractError = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: unknown[] }
      | undefined;
    if (data?.message) return data.message;
    if (Array.isArray(data?.errors) && data!.errors!.length > 0) {
      return data!.errors!.map((e) => String(e)).join(", ");
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

const AccrualRunPanel: React.FC<AccrualRunPanelProps> = ({ organizationId, onPosted }) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const currentYear = new Date().getFullYear();
  const [form] = Form.useForm();
  const { accrualPreview, accrualLoading, setAccrualPreview, setAccrualLoading } = useHrmLeaveStore();
  const [posting, setPosting] = useState(false);
  const [batches, setBatches] = useState<AccrualBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchYear, setBatchYear] = useState<number>(currentYear);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>("QUARTERLY");
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // Auto-fill periodStart/periodEnd whenever the period selector or year
  // changes.  Keeps the run window consistent with the selected period so
  // the dates can't drift.
  const syncPeriod = (
    type: PeriodType,
    quarter: Quarter | undefined,
    month: number | undefined,
    year: number | undefined,
  ) => {
    if (!year || !Number.isFinite(year)) return;

    let period: { start: Dayjs; end: Dayjs } | null = null;
    let quarterField: string | undefined;

    switch (type) {
      case "QUARTERLY":
        if (!quarter) return;
        period = getQuarterPeriod(quarter, year);
        quarterField = quarter;
        break;
      case "MONTHLY":
        if (!month) return;
        period = getMonthPeriod(month, year);
        quarterField = `M${String(month).padStart(2, "0")}`;
        break;
      case "ANNUAL":
        period = getAnnualPeriod(year);
        quarterField = "ANNUAL";
        break;
    }

    if (period) {
      form.setFieldsValue({
        periodStart: period.start,
        periodEnd: period.end,
        quarter: quarterField,
      });
    }
  };

  const loadBatches = async (year: number) => {
    setBatchesLoading(true);
    try {
      const data = await HrmLeaveService.getAccrualBatches({ organizationId, year });
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) loadBatches(batchYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, batchYear]);

  const handleRollback = async (batch: AccrualBatch) => {
    setRollingBackId(batch.handle);
    try {
      await HrmLeaveService.rollbackAccrual({ organizationId,
        batchId: batch.handle,
        requestedBy: userId,
      });
      message.success("Accrual batch rolled back");
      loadBatches(batchYear);
    } catch (err) {
      message.error(extractError(err, "Failed to roll back batch"));
    } finally {
      setRollingBackId(null);
    }
  };

  const handlePreview = async () => {
    let values: {
      quarter: string;
      year: number;
      periodStart: Dayjs;
      periodEnd: Dayjs;
    };
    try {
      values = await form.validateFields();
    } catch {
      // Ant's own validation messages already surface below each field.
      return;
    }

    // Cross-field sanity: period end must not be before period start. Ant
    // form validators don't do cross-field comparisons by default.
    if (values.periodEnd.isBefore(values.periodStart, "day")) {
      message.error("Period end must be on or after period start");
      return;
    }

    try {
      setAccrualLoading(true);
      const res = await HrmLeaveService.previewAccrual({ organizationId,
        periodStart: values.periodStart.format("YYYY-MM-DD"),
        periodEnd: values.periodEnd.format("YYYY-MM-DD"),
        quarter: values.quarter,
        year: values.year,
        preview: true,
        createdBy: userId,
      });
      setAccrualPreview({
        batchId: res.batchId,
        periodStart: res.periodStart,
        periodEnd: res.periodEnd,
        quarter: res.quarter,
        year: res.year,
        totalEligibleEmployees: res.totalEligibleEmployees,
        totalDaysToCredit: res.totalDaysToCredit,
        lines: res.lines,
        errors: res.errors,
        canPost: res.canPost,
      });
    } catch (err) {
      message.error(extractError(err, "Failed to generate accrual preview"));
    } finally {
      setAccrualLoading(false);
    }
  };

  const handlePost = async () => {
    if (!accrualPreview?.canPost) return;
    setPosting(true);
    try {
      const values = form.getFieldsValue();
      const batch = await HrmLeaveService.postAccrual({ organizationId,
        periodStart: values.periodStart.format("YYYY-MM-DD"),
        periodEnd: values.periodEnd.format("YYYY-MM-DD"),
        quarter: values.quarter,
        year: values.year,
        preview: false,
        createdBy: userId,
      });
      message.success("Accrual posted successfully");
      setAccrualPreview(null);
      loadBatches(batchYear);
      onPosted(batch.handle);
    } catch (err) {
      message.error(extractError(err, "Failed to post accrual"));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className={styles.accrualPanel}>
      <Title level={5}>Accrual Run</Title>

      <div style={{ marginBottom: 12 }}>
        <Space>
          <Text strong>Period Type:</Text>
          <Segmented
            value={periodType}
            options={[
              { value: "MONTHLY", label: "Monthly" },
              { value: "QUARTERLY", label: "Quarterly" },
              { value: "ANNUAL", label: "Annual" },
            ]}
            onChange={(value) => {
              const newType = value as PeriodType;
              setPeriodType(newType);
              // Re-sync period dates for the new type
              const year = form.getFieldValue("year") as number | undefined;
              syncPeriod(
                newType,
                newType === "QUARTERLY" ? selectedQuarter : undefined,
                newType === "MONTHLY" ? selectedMonth : undefined,
                year,
              );
            }}
          />
        </Space>
      </div>

      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16 }}
        initialValues={{ year: currentYear }}
      >
        {/* Hidden field that always holds the quarter/period identifier sent to backend */}
        <Form.Item name="quarter" hidden rules={[{ required: true, message: "Period selection is required" }]}>
          <Input />
        </Form.Item>

        {periodType === "QUARTERLY" && (
          <Form.Item label="Quarter">
            <Select
              value={selectedQuarter}
              options={QUARTER_OPTIONS}
              style={{ width: 160 }}
              onChange={(value: Quarter) => {
                setSelectedQuarter(value);
                form.setFieldsValue({ quarter: value });
                syncPeriod("QUARTERLY", value, undefined, form.getFieldValue("year"));
              }}
            />
          </Form.Item>
        )}

        {periodType === "MONTHLY" && (
          <Form.Item label="Month">
            <Select
              value={selectedMonth}
              options={MONTH_OPTIONS}
              style={{ width: 160 }}
              onChange={(value: number) => {
                setSelectedMonth(value);
                const year = form.getFieldValue("year") as number | undefined;
                syncPeriod("MONTHLY", undefined, value, year);
              }}
            />
          </Form.Item>
        )}

        <Form.Item
          name="year"
          label="Year"
          rules={[
            { required: true, message: "Year is required" },
            {
              validator: (_, value) =>
                typeof value === "number" && value >= 2000 && value <= 2100
                  ? Promise.resolve()
                  : Promise.reject(new Error("Enter a valid year (2000–2100)")),
            },
          ]}
        >
          <InputNumber
            style={{ width: 100 }}
            min={2000}
            max={2100}
            onChange={(value) => {
              const year = typeof value === "number" ? value : undefined;
              syncPeriod(
                periodType,
                periodType === "QUARTERLY" ? selectedQuarter : undefined,
                periodType === "MONTHLY" ? selectedMonth : undefined,
                year,
              );
            }}
          />
        </Form.Item>
        <Form.Item name="periodStart" label="Period Start" rules={[{ required: true }]}>
          <DatePicker format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item
          name="periodEnd"
          label="Period End"
          dependencies={["periodStart"]}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const start = getFieldValue("periodStart") as Dayjs | undefined;
                if (!value || !start) return Promise.resolve();
                return (value as Dayjs).isBefore(start, "day")
                  ? Promise.reject(
                      new Error("Period end must be on or after period start"),
                    )
                  : Promise.resolve();
              },
            }),
          ]}
        >
          <DatePicker format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handlePreview} loading={accrualLoading}>
            Preview
          </Button>
        </Form.Item>
      </Form>

      {accrualPreview && (
        <Card size="small">
          <Space size="large" style={{ marginBottom: 12 }}>
            <Statistic title="Eligible Employees" value={accrualPreview.totalEligibleEmployees} />
            <Statistic title="Total Days to Credit" value={accrualPreview.totalDaysToCredit} precision={1} />
          </Space>

          {accrualPreview.errors && accrualPreview.errors.length > 0 && (
            <Alert
              type="warning"
              message={`Accrual Errors (${accrualPreview.errors.length})`}
              description={
                <List
                  size="small"
                  dataSource={accrualPreview.errors}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
              }
              style={{ marginBottom: 8 }}
            />
          )}

          <div className={styles.accrualLines}>
            {(accrualPreview.lines ?? []).map((line, i) => (
              <AccrualPreviewLine key={`${line.employeeId}-${i}`} line={line} />
            ))}
          </div>

          {accrualPreview.canPost && (
            <Can I="add" object="leave_accrual" passIf={true}>
              <Button
                type="primary"
                onClick={handlePost}
                loading={posting}
                style={{ marginTop: 12 }}
              >
                Post Accrual
              </Button>
            </Can>
          )}
        </Card>
      )}

      <div style={{ marginTop: 24 }}>
        <Space style={{ justifyContent: "space-between", width: "100%", display: "flex", marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0 }}>Batch History</Title>
          <Space>
            <Text type="secondary">Year</Text>
            <Input
              type="number"
              value={batchYear}
              onChange={(e) => setBatchYear(Number(e.target.value) || new Date().getFullYear())}
              style={{ width: 100 }}
            />
            <Button size="small" onClick={() => loadBatches(batchYear)}>Refresh</Button>
          </Space>
        </Space>
        <Table
          dataSource={batches}
          rowKey="handle"
          size="small"
          loading={batchesLoading}
          pagination={{ pageSize: 10 }}
          columns={
            [
              { title: "Batch ID", dataIndex: "handle", key: "handle", width: 180 },
              {
                title: "Date Range",
                key: "period",
                render: (_v: unknown, row: AccrualBatch) => `${row.periodStart} → ${row.periodEnd}`,
              },
              {
                title: "Period",
                key: "quarter",
                width: 140,
                render: (_v: unknown, row: AccrualBatch) => formatBatchQuarter(row.quarter, row.year),
              },
              { title: "Run Date", dataIndex: "postDate", key: "postDate", width: 120 },
              { title: "Employees", dataIndex: "totalEmployees", key: "totalEmployees", width: 100 },
              {
                title: "Credits",
                dataIndex: "totalDaysCredited",
                key: "totalDaysCredited",
                width: 100,
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                width: 120,
                render: (v: AccrualBatch["status"]) => (
                  <Tag color={v === "POSTED" ? "green" : v === "ROLLED_BACK" ? "red" : "default"}>
                    {v}
                  </Tag>
                ),
              },
              {
                title: "Action",
                key: "action",
                width: 140,
                render: (_v: unknown, row: AccrualBatch) =>
                  row.status === "POSTED" ? (
                    <Can I="delete" object="leave_accrual" passIf={true}>
                      <Popconfirm
                        title="Roll back this batch?"
                        description="This will reverse the accrual entries."
                        onConfirm={() => handleRollback(row)}
                        okText="Rollback"
                        okButtonProps={{ danger: true }}
                        cancelText="Cancel"
                      >
                        <Button
                          size="small"
                          danger
                          type="link"
                          loading={rollingBackId === row.handle}
                        >
                          Rollback
                        </Button>
                      </Popconfirm>
                    </Can>
                  ) : null,
              },
            ] as ColumnsType<AccrualBatch>
          }
        />
      </div>
    </div>
  );
};

export default AccrualRunPanel;
