'use client';

import React, { useState } from "react";
import { Alert, Button, Progress, Space, Typography, Upload, message } from "antd";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import UploadSummaryTable from "./UploadSummaryTable";
import styles from "../../styles/PayslipUpload.module.css";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const PayslipUploadPanel: React.FC = () => {
  const { uploadBatch, uploading, uploadProgress, uploadFiles, clearUploadBatch } =
    useHrmPayslipStore();
  const [selected, setSelected] = useState<UploadFile[]>([]);
  // Files a failed chunk left behind. They stay selected so pressing Upload retries them.
  const [notUploaded, setNotUploaded] = useState(0);

  const start = async () => {
    const files = selected
      .map((f) => f.originFileObj as File | undefined)
      .filter((f): f is File => Boolean(f));
    if (files.length === 0) return;
    const { unsent } = await uploadFiles(files);
    const unsentSet = new Set<File>(unsent);
    // Clear only what reached the server; anything unsent stays selected for the retry.
    setSelected((current) =>
      current.filter((f) => unsentSet.has(f.originFileObj as unknown as File))
    );
    setNotUploaded(unsent.length);
  };

  return (
    <div className={styles.uploadRoot}>
      <Alert
        type="info"
        showIcon
        message="Name each file Rxxxxx_mmm-yyyy.pdf"
        description="For example R10101_Aug-2026.pdf. The employee code and pay period are read from the file name, so a file named any other way is reported back rather than stored."
        className={styles.namingHint}
      />

      <Upload.Dragger
        multiple
        accept="application/pdf,.pdf"
        beforeUpload={(file) => {
          if (file.size > MAX_FILE_BYTES) {
            message.error(`${file.name} is over 10 MB and was not added`);
            return Upload.LIST_IGNORE;
          }
          return false;
        }}
        fileList={selected}
        onChange={({ fileList }) => setSelected(fileList)}
        disabled={uploading}
        className={styles.dragger}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Drop this month&apos;s payslip PDFs here</p>
        <p className="ant-upload-hint">
          Up to 200 files at a time. They upload in batches of 25.
        </p>
      </Upload.Dragger>

      {notUploaded > 0 && !uploading && (
        <Alert
          type="warning"
          showIcon
          message={`${notUploaded} file${notUploaded === 1 ? " was" : "s were"} not uploaded — press Upload to retry`}
          description="They are still selected. Uploading them again adds them to the same batch as any files that did get through."
          className={styles.namingHint}
        />
      )}

      <Space className={styles.actions}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={selected.length === 0}
          onClick={start}
        >
          Upload {selected.length > 0 ? `${selected.length} file${selected.length === 1 ? "" : "s"}` : ""}
        </Button>
        {uploadBatch && !uploading && (
          <Button
            onClick={() => {
              clearUploadBatch();
              setNotUploaded(0);
            }}
          >
            Start another upload
          </Button>
        )}
      </Space>

      {uploading && uploadProgress.total > 0 && (
        <Progress
          percent={Math.round((uploadProgress.done / uploadProgress.total) * 100)}
          status="active"
        />
      )}

      {uploadBatch && (
        <>
          <Typography.Title level={5} className={styles.summaryTitle}>
            Upload summary
          </Typography.Title>
          <UploadSummaryTable batch={uploadBatch} />
        </>
      )}
    </div>
  );
};

export default PayslipUploadPanel;
