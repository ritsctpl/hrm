'use client';

import React, { useEffect } from "react";
import { Button, Table, Tag, Typography } from "antd";
import { CloseOutlined, FolderOpenOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import { formatDate } from "../../utils/payslipFormatters";
import type { PayslipUploadBatch } from "../../types/domain.types";
import UploadSummaryTable from "./UploadSummaryTable";
import styles from "../../styles/PayslipUpload.module.css";

const UploadHistoryPanel: React.FC = () => {
  const { batchHistory, batchHistoryLoading, loadBatchHistory, openBatch, uploadBatch, clearUploadBatch } =
    useHrmPayslipStore();

  useEffect(() => {
    loadBatchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<PayslipUploadBatch> = [
    {
      title: "Uploaded",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      width: 170,
      render: (v) => (v ? formatDate(v) : "--"),
    },
    { title: "By", dataIndex: "uploadedBy", key: "uploadedBy", width: 140 },
    { title: "Files", dataIndex: "totalFiles", key: "totalFiles", width: 80 },
    {
      title: "Stored",
      dataIndex: "matchedCount",
      key: "matchedCount",
      width: 90,
      render: (v) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "Need attention",
      dataIndex: "skippedCount",
      key: "skippedCount",
      width: 140,
      render: (v: number) => (v > 0 ? <Tag color="red">{v}</Tag> : <Tag>0</Tag>),
    },
    { title: "Status", dataIndex: "status", key: "status", width: 150 },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          icon={<FolderOpenOutlined />}
          onClick={() => openBatch(record.handle)}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.uploadRoot}>
      <Typography.Paragraph type="secondary">
        Every payslip upload, newest first. Open a batch to see its per-file summary and export the
        files that still need correcting.
      </Typography.Paragraph>
      <Table
        dataSource={batchHistory}
        columns={columns}
        rowKey="handle"
        size="small"
        loading={batchHistoryLoading}
        pagination={{ pageSize: 20 }}
      />
      {uploadBatch && (
        <div>
          <div className={styles.actions}>
            <Button size="small" icon={<CloseOutlined />} onClick={clearUploadBatch}>
              Close
            </Button>
          </div>
          <UploadSummaryTable batch={uploadBatch} />
        </div>
      )}
    </div>
  );
};

export default UploadHistoryPanel;
