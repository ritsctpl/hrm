'use client';

import React from "react";
import { Button, Space, Table, Tag, Typography } from "antd";
import { DownloadOutlined, EyeOutlined, SyncOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import PayslipStatusTag from "../atoms/PayslipStatusTag";
import RepositoryFilterBar from "./RepositoryFilterBar";
import type { PayslipListItem, PayslipSource } from "../../types/domain.types";
import { formatDate, formatPeriodLabel } from "../../utils/payslipFormatters";
import Can from "../../../hrmAccess/components/Can";
import { useCan } from "../../../hrmAccess/hooks/useCan";
import styles from "../../styles/PayslipRepository.module.css";

const PayslipRepository: React.FC = () => {
  const store = useHrmPayslipStore();

  // Reading another employee's payslip is DOWNLOAD_ANY on the backend (payslip_download|VIEW, R7).
  const { canView: canDownload } = useCan("HRM_PAYSLIP", "payslip_download");

  // HR by-handle endpoints, routed by source in the store (shared with the Generate panel).
  const download = (record: PayslipListItem) => store.downloadListedPayslip(record);

  const columns: ColumnsType<PayslipListItem> = [
    { title: "Emp ID", dataIndex: "employeeId", key: "employeeId", width: 100 },
    { title: "Emp No", dataIndex: "employeeNumber", key: "employeeNumber", width: 110 },
    { title: "Name", dataIndex: "employeeName", key: "employeeName" },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 110,
      render: (source: PayslipSource) => (
        <Tag color={source === "UPLOADED" ? "blue" : "default"}>
          {source === "UPLOADED" ? "Uploaded" : "Generated"}
        </Tag>
      ),
    },
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
          {canDownload && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              title="View"
              onClick={() => download(record)}
            />
          )}
          {canDownload && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              title="Download"
              onClick={() => download(record)}
            />
          )}
          {record.status === "FAILED" && (
            <Can I="edit" object="payslip_generate">
              <Button
                size="small"
                icon={<SyncOutlined />}
                title="Regenerate"
                onClick={() => store.regenerateOne(record.employeeId)}
              />
            </Can>
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
