'use client';

import React from "react";
import { Button, Space, Table, Typography } from "antd";
import { DownloadOutlined, EyeOutlined, SyncOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import PayslipStatusTag from "../atoms/PayslipStatusTag";
import RepositoryFilterBar from "./RepositoryFilterBar";
import type { PayslipListItem } from "../../types/domain.types";
import { formatDate, formatPeriodLabel } from "../../utils/payslipFormatters";
import styles from "../../styles/PayslipRepository.module.css";

const PayslipRepository: React.FC = () => {
  const store = useHrmPayslipStore();

  const columns: ColumnsType<PayslipListItem> = [
    { title: "Emp ID", dataIndex: "employeeId", key: "employeeId", width: 100 },
    { title: "Emp No", dataIndex: "employeeNumber", key: "employeeNumber", width: 110 },
    { title: "Name", dataIndex: "employeeName", key: "employeeName" },
    { title: "Department", dataIndex: "department", key: "department", width: 130 },
    {
      title: "Period",
      key: "period",
      width: 120,
      render: (_, r) => formatPeriodLabel(r.payrollYear, r.payrollMonth),
    },
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
            title="View"
            onClick={() =>
              store.downloadOne(record.employeeId, record.payrollYear, record.payrollMonth)
            }
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            title="Download"
            onClick={() =>
              store.downloadOne(record.employeeId, record.payrollYear, record.payrollMonth)
            }
          />
          {record.status === "FAILED" && (
            <Button
              size="small"
              icon={<SyncOutlined />}
              title="Regenerate"
              onClick={() => store.regenerateOne(record.employeeId)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.repositoryRoot}>
      <RepositoryFilterBar />

      {store.repositoryList.length > 0 && (
        <Typography.Text type="secondary" className={styles.resultCount}>
          Showing {store.repositoryList.length} payslips
        </Typography.Text>
      )}

      <Table
        dataSource={store.repositoryList}
        columns={columns}
        rowKey="handle"
        size="small"
        loading={store.repositoryLoading}
        pagination={{ pageSize: 20 }}
        footer={() => (
          <div className={styles.tableFooter}>
            <Button
              icon={<DownloadOutlined />}
              disabled={store.repositoryList.length === 0}
              onClick={store.downloadAllZip}
            >
              Download All as ZIP
            </Button>
            <Typography.Text type="secondary">
              {store.repositoryList.length} payslips
            </Typography.Text>
          </div>
        )}
      />
    </div>
  );
};

export default PayslipRepository;
