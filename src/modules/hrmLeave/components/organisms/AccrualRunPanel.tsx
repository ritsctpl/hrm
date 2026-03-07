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
  Statistic,
  Typography,
  message,
  Alert,
} from "antd";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../../services/hrmLeaveService";
import { useHrmLeaveStore, AccrualPreviewData } from "../../stores/hrmLeaveStore";
import { AccrualRunPanelProps } from "../../types/ui.types";
import AccrualPreviewLine from "../molecules/AccrualPreviewLine";
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
            <Button
              type="primary"
              onClick={handlePost}
              loading={posting}
              style={{ marginTop: 12 }}
            >
              Post Accrual
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default AccrualRunPanel;
