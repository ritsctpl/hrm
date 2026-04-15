"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Popconfirm,
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
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useHrmLeaveStore, AccrualPreviewData } from "../../stores/hrmLeaveStore";
import { AccrualRunPanelProps } from "../../types/ui.types";
import { AccrualBatch } from "../../types/api.types";
import AccrualPreviewLine from "../molecules/AccrualPreviewLine";
import Can from "../../../hrmAccess/components/Can";
import styles from "../../styles/HrmLeave.module.css";

const { Title, Text } = Typography;

const QUARTER_OPTIONS = [
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
];

const AccrualRunPanel: React.FC<AccrualRunPanelProps> = ({ site, onPosted }) => {
  const cookies = parseCookies();
  const userId = cookies.userId ?? "";
  const [form] = Form.useForm();
  const { accrualPreview, accrualLoading, setAccrualPreview, setAccrualLoading } = useHrmLeaveStore();
  const [posting, setPosting] = useState(false);
  const [batches, setBatches] = useState<AccrualBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchYear, setBatchYear] = useState<number>(new Date().getFullYear());
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  const loadBatches = async (year: number) => {
    setBatchesLoading(true);
    try {
      const data = await HrmLeaveService.getAccrualBatches({ site, year });
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  };

  useEffect(() => {
    if (site) loadBatches(batchYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, batchYear]);

  const handleRollback = async (batch: AccrualBatch) => {
    setRollingBackId(batch.handle);
    try {
      await HrmLeaveService.rollbackAccrual({
        site,
        batchId: batch.handle,
        requestedBy: userId,
      });
      message.success("Accrual batch rolled back");
      loadBatches(batchYear);
    } catch {
      message.error("Failed to roll back batch");
    } finally {
      setRollingBackId(null);
    }
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      setAccrualLoading(true);
      const res = await HrmLeaveService.previewAccrual({
        site,
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
    } catch {
      message.error("Failed to generate accrual preview");
    } finally {
      setAccrualLoading(false);
    }
  };

  const handlePost = async () => {
    if (!accrualPreview?.canPost) return;
    setPosting(true);
    try {
      const values = form.getFieldsValue();
      const batch = await HrmLeaveService.postAccrual({
        site,
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
    } catch {
      message.error("Failed to post accrual");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className={styles.accrualPanel}>
      <Title level={5}>Accrual Run</Title>

      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="quarter" label="Quarter" rules={[{ required: true }]}>
          <Select options={QUARTER_OPTIONS} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="year" label="Year" rules={[{ required: true }]}>
          <Input type="number" style={{ width: 80 }} defaultValue={new Date().getFullYear()} />
        </Form.Item>
        <Form.Item name="periodStart" label="Period Start" rules={[{ required: true }]}>
          <DatePicker format="DD-MMM-YYYY" />
        </Form.Item>
        <Form.Item name="periodEnd" label="Period End" rules={[{ required: true }]}>
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

          {accrualPreview.errors?.length > 0 && (
            <Alert
              type="warning"
              message="Accrual Errors"
              description={accrualPreview.errors.join(", ")}
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
                title: "Period",
                key: "period",
                render: (_v: unknown, row: AccrualBatch) => `${row.periodStart} → ${row.periodEnd}`,
              },
              { title: "Quarter", dataIndex: "quarter", key: "quarter", width: 80 },
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
