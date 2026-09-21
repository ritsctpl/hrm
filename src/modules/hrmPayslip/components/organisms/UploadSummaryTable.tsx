'use client';

import React, { useMemo } from "react";
import { Button, Space, Statistic, Table, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import ParseStatusTag from "../atoms/ParseStatusTag";
import { errorRowsToCsv, isStoredStatus, summarise, withRowKeys } from "../../utils/uploadHelpers";
import { saveBlob } from "../../utils/saveBlob";
import type { PayslipUploadBatch, PayslipUploadItem } from "../../types/domain.types";
import styles from "../../styles/PayslipUpload.module.css";

interface Props {
  batch: PayslipUploadBatch;
}

const UploadSummaryTable: React.FC<Props> = ({ batch }) => {
  const summary = useMemo(() => summarise(batch), [batch]);
  const rows = useMemo(() => withRowKeys(batch.items), [batch]);

  const downloadErrorCsv = () => {
    const blob = new Blob([errorRowsToCsv(batch)], { type: "text/csv;charset=utf-8" });
    saveBlob(blob, `payslip-upload-errors-${batch.handle}.csv`);
  };

  const columns: ColumnsType<PayslipUploadItem> = [
    { title: "File", dataIndex: "fileName", key: "fileName", ellipsis: true },
    {
      title: "Status",
      dataIndex: "parseStatus",
      key: "parseStatus",
      width: 150,
      render: (s) => <ParseStatusTag status={s} />,
    },
    { title: "Employee", dataIndex: "employeeName", key: "employeeName",
      render: (name, r) => (name ? `${r.employeeCode} — ${name}` : r.employeeCode ?? "--") },
    {
      title: "Period",
      key: "period",
      width: 110,
      render: (_, r) =>
        r.payrollYear && r.payrollMonth ? `${r.payrollMonth}/${r.payrollYear}` : "--",
    },
    { title: "Details", dataIndex: "reason", key: "reason",
      render: (reason) => reason ?? "--" },
  ];

  return (
    <div className={styles.summaryRoot}>
      <Space size="large" className={styles.summaryStats}>
        <Statistic title="Files" value={summary.total} />
        <Statistic title="Stored" value={summary.stored} valueStyle={{ color: "#389e0d" }} />
        <Statistic
          title="Need attention"
          value={summary.skipped}
          valueStyle={{ color: summary.skipped > 0 ? "#cf1322" : undefined }}
        />
        <Button
          icon={<DownloadOutlined />}
          disabled={summary.skipped === 0}
          onClick={downloadErrorCsv}
        >
          Export problems
        </Button>
      </Space>

      {summary.skipped > 0 && (
        <Typography.Paragraph type="warning" className={styles.summaryNote}>
          {summary.skipped} file{summary.skipped === 1 ? "" : "s"} could not be placed. Correct the
          name or the employee code and upload {summary.skipped === 1 ? "it" : "them"} again — the
          files already stored are unaffected.
        </Typography.Paragraph>
      )}

      <Table
        dataSource={rows}
        columns={columns}
        rowKey="rowKey"
        size="small"
        pagination={{ pageSize: 25 }}
        rowClassName={(r) => (isStoredStatus(r.parseStatus) ? "" : styles.problemRow)}
      />
    </div>
  );
};

export default UploadSummaryTable;
