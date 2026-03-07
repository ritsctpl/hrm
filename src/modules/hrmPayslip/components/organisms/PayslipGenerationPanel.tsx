'use client';

import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  FileProtectOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import PayslipStatusTag from "../atoms/PayslipStatusTag";
import EmployeeSelector from "./EmployeeSelector";
import GenerationProgress from "./GenerationProgress";
import GenerationResultsCard from "../molecules/GenerationResultsCard";
import type { PayslipListItem } from "../../types/domain.types";
import { MONTHS, YEAR_OPTIONS } from "../../utils/payslipConstants";
import { formatDate } from "../../utils/payslipFormatters";
import styles from "../../styles/Payslip.module.css";

const { Text } = Typography;

const MOCK_EMPLOYEES = [
  { employeeId: "EMP001", employeeName: "Rajesh Kumar", department: "Engineering" },
  { employeeId: "EMP002", employeeName: "Priya Sharma", department: "HR" },
  { employeeId: "EMP003", employeeName: "Amit Gupta", department: "Finance" },
];

const PayslipGenerationPanel: React.FC = () => {
  const store = useHrmPayslipStore();
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    store.loadGenerationContext(store.generationYear, store.generationMonth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<PayslipListItem> = [
    { title: "Emp ID", dataIndex: "employeeId", key: "employeeId", width: 100 },
    { title: "Emp No", dataIndex: "employeeNumber", key: "employeeNumber", width: 110 },
    { title: "Name", dataIndex: "employeeName", key: "employeeName" },
    { title: "Department", dataIndex: "department", key: "department", width: 120 },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s) => <PayslipStatusTag status={s} />,
    },
    {
      title: "Generated At",
      dataIndex: "generatedAt",
      key: "generatedAt",
      width: 150,
      render: (v) => (v ? formatDate(v) : "--"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              store.downloadOne(record.employeeId, record.payrollYear, record.payrollMonth)
            }
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() =>
              store.downloadOne(record.employeeId, record.payrollYear, record.payrollMonth)
            }
          />
          {record.status === "FAILED" && (
            <Button
              size="small"
              icon={<SyncOutlined />}
              onClick={() => store.regenerateOne(record.employeeId)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.generationRoot}>
      <Card title="Select Payroll Period" className={styles.generationCard}>
        <Space wrap>
          <div>
            <Text type="secondary">Payroll Year: </Text>
            <Select
              value={store.generationYear}
              onChange={(v) => {
                store.setGenerationYear(v);
                store.loadGenerationContext(v, store.generationMonth);
              }}
              options={YEAR_OPTIONS.map((y) => ({ value: y, label: String(y) }))}
              style={{ width: 100 }}
            />
          </div>
          <div>
            <Text type="secondary">Payroll Month: </Text>
            <Select
              value={store.generationMonth}
              onChange={(v) => {
                store.setGenerationMonth(v);
                store.loadGenerationContext(store.generationYear, v);
              }}
              options={MONTHS.map((m) => ({ value: m.value, label: `${m.fullLabel} (${m.value})` }))}
              style={{ width: 160 }}
            />
          </div>
        </Space>
        {store.generationRunStatus && (
          <div style={{ marginTop: 12 }}>
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="Run ID">{store.generationRunId ?? "--"}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={store.generationRunStatus === "FINALIZED" ? "green" : "orange"}>
                  {store.generationRunStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Employees">
                {store.generationRunEmployeeCount}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Card>

      {store.activeTemplate && (
        <Card title="Active Template" className={styles.generationCard}>
          <Space align="center">
            <Text>{store.activeTemplate.templateName}</Text>
            <Text type="secondary">Version: {store.activeTemplate.version}</Text>
            <Tag color="green">Active</Tag>
            <Button size="small" onClick={() => setPreviewOpen(true)}>
              Preview Template
            </Button>
          </Space>
        </Card>
      )}

      <Card title="Generation Scope" className={styles.generationCard}>
        <Radio.Group
          value={store.generateScope}
          onChange={(e) => store.setGenerateScope(e.target.value)}
          style={{ marginBottom: 16 }}
        >
          <Radio value="all">Generate All</Radio>
          <Radio value="selected">Select Specific Employees</Radio>
        </Radio.Group>
        {store.generateScope === "selected" && (
          <EmployeeSelector
            employees={MOCK_EMPLOYEES}
            selectedIds={store.selectedEmployeeIds}
            onSelectionChange={store.setSelectedEmployeeIds}
          />
        )}
      </Card>

      <Button
        type="primary"
        size="large"
        icon={<FileProtectOutlined />}
        loading={store.generating}
        onClick={store.runGeneration}
        style={{ marginBottom: 16 }}
        block
      >
        Generate Payslips
      </Button>

      {store.generating && <GenerationProgress />}

      {store.generationResult && !store.generating && (
        <Card title="Generation Results" className={styles.generationCard}>
          <GenerationResultsCard
            totalRequested={store.generationResult.totalRequested}
            successCount={store.generationResult.successCount}
            failureCount={store.generationResult.failureCount}
            failedEmployeeIds={store.generationResult.failedEmployeeIds}
          />
          <Divider />
          <Space>
            <Button icon={<DownloadOutlined />} onClick={store.downloadAllZip}>
              Download All as ZIP
            </Button>
            <Button disabled>Email All (Future)</Button>
          </Space>
        </Card>
      )}

      {store.distributionList.length > 0 && (
        <Card title="Distribution Status" className={styles.generationCard}>
          <Table
            dataSource={store.distributionList}
            columns={columns}
            rowKey="handle"
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {previewOpen && store.activeTemplate && (
        <Alert
          message={`Template Preview: ${store.activeTemplate.templateName}`}
          description="Preview functionality requires a sample payslip data. Close to continue."
          type="info"
          closable
          onClose={() => setPreviewOpen(false)}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
};

export default PayslipGenerationPanel;
