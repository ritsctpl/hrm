'use client';

import React, { useCallback, useState } from 'react';
import {
  Alert, Button, Card, Checkbox, Result, Space, Steps, Table, Tag, Typography, Upload, message,
} from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { parseCookies } from 'nookies';
import { HrmPayrollHistoryService } from '../../services/payrollHistoryService';
import type { PayrollHistoryPreview, PayrollHistoryRow, PayrollHistoryCommitResult }
  from '../../types/domain.types';

/**
 * Historical payroll back-load — the one new screen in this feature. fe-spec §3.
 *
 * Upload → review → commit, and never anything else. Dropping a file parses and reports; it does not
 * write. The summary says so in words, because a screen that cannot prove it saved nothing invites
 * people to commit blind.
 */
const PayrollHistoryImport: React.FC = () => {
  const [preview, setPreview] = useState<PayrollHistoryPreview | null>(null);
  const [result, setResult] = useState<PayrollHistoryCommitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setPreview(null); setResult(null); setError(null); setSkipInvalid(false); };

  const handleUpload = useCallback(async (file: File) => {
    setBusy(true); setError(null); setResult(null);
    try {
      setPreview(await HrmPayrollHistoryService.preview(file));
    } catch (e: any) {
      setPreview(null);
      setError(e?.response?.data?.message_details?.msg
        ?? 'That file could not be read. Download the template and fill that instead.');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleCommit = useCallback(async () => {
    if (!preview) return;
    setBusy(true); setError(null);
    try {
      const performedBy = parseCookies().rl_user_id ?? '';
      setResult(await HrmPayrollHistoryService.commit(preview.uploadRef, skipInvalid, performedBy));
      setPreview(null);
    } catch (e: any) {
      setError(e?.response?.data?.message_details?.msg ?? 'The import could not be committed.');
    } finally {
      setBusy(false);
    }
  }, [preview, skipInvalid]);

  const dragger: UploadProps = {
    accept: '.csv,text/csv',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => { handleUpload(file as File); return false; },
  };

  const columns = [
    { title: 'Row', dataIndex: 'rowNumber', width: 70 },
    { title: 'Emp ID', dataIndex: 'employeeCode', width: 120 },
    { title: 'Name', dataIndex: 'employeeName', width: 200,
      render: (v: string | null) => v ?? <Typography.Text type="secondary">(not found)</Typography.Text> },
    { title: 'Period', dataIndex: 'payPeriodLabel', width: 110 },
    { title: 'Gross', dataIndex: 'grossEarnings', align: 'right' as const, width: 120,
      render: (v: number | null) => (v == null ? '-' : `₹${Math.round(v).toLocaleString('en-IN')}`) },
    { title: 'Net', dataIndex: 'netPay', align: 'right' as const, width: 120,
      render: (v: number | null) => (v == null ? '-' : `₹${Math.round(v).toLocaleString('en-IN')}`) },
    { title: 'Status', dataIndex: 'status', width: 100,
      render: (s: PayrollHistoryRow['status']) => (
        <Tag color={s === 'OK' ? 'success' : s === 'WARN' ? 'warning' : 'error'}>{s}</Tag>
      ) },
  ];

  const step = result ? 2 : preview ? 1 : 0;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Import Paid Payroll (History)</Typography.Title>
        <Button icon={<DownloadOutlined />} onClick={() => HrmPayrollHistoryService.downloadTemplate()}>
          Download CSV template
        </Button>
      </div>

      <Steps
        size="small"
        current={step}
        items={[{ title: 'Upload' }, { title: 'Review' }, { title: 'Commit' }]}
        style={{ marginBottom: 16 }}
      />

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      {result ? (
        <Result
          status="success"
          title={`Imported ${result.payslipsCreated} payslips across ${result.runsCreated} months.`}
          subTitle={result.rowsSkipped > 0
            ? `${result.rowsSkipped} rows were skipped because they had errors.`
            : undefined}
          extra={[
            <Button type="primary" key="again" onClick={reset}>Import another file</Button>,
          ]}
        >
          {result.messages && result.messages.length > 0 && (
            <Alert type="warning" showIcon style={{ textAlign: 'left' }}
              message="Some periods were not imported"
              description={<ul style={{ margin: 0, paddingLeft: 18 }}>
                {result.messages.map((m) => <li key={m}>{m}</li>)}
              </ul>} />
          )}
        </Result>
      ) : !preview ? (
        <Card>
          <Upload.Dragger {...dragger} disabled={busy}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Drag a CSV here, or click to choose</p>
            <p className="ant-upload-hint">
              One row per employee per month. Import what was already paid, so employees can download
              past payslips — this does not recalculate anything.
            </p>
          </Upload.Dragger>
        </Card>
      ) : (
        <>
          <Card size="small" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Space size="small">
                <Tag>{preview.totalRows} rows</Tag>
                <Tag color="success">{preview.okCount} ok</Tag>
                <Tag color="warning">{preview.warnCount} warnings</Tag>
                <Tag color="error">{preview.errorCount} errors</Tag>
              </Space>
              <Typography.Text strong type="secondary">Nothing has been saved yet.</Typography.Text>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                {preview.errorCount > 0 && (
                  <Checkbox checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)}>
                    Skip invalid rows
                  </Checkbox>
                )}
                <Button onClick={reset}>Choose a different file</Button>
                <Button
                  type="primary"
                  loading={busy}
                  disabled={preview.errorCount > 0 && !skipInvalid}
                  onClick={handleCommit}
                >
                  Commit {preview.okCount + preview.warnCount} valid rows
                </Button>
              </div>
            </div>
            {preview.periods && preview.periods.length > 0 && (
              <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 12 }}>
                Periods in this file: {preview.periods.join(', ')}. Imported months are locked and
                cannot be edited.
              </Typography.Paragraph>
            )}
          </Card>

          <Table<PayrollHistoryRow>
            size="small"
            rowKey="rowNumber"
            dataSource={preview.rows ?? []}
            columns={columns}
            pagination={{ pageSize: 25, showSizeChanger: false }}
            expandable={{
              // The reason sits under the row it belongs to. A row is never silently dropped.
              expandedRowRender: (row) => (
                <Typography.Text type={row.status === 'ERROR' ? 'danger' : 'warning'}>
                  {row.message}
                </Typography.Text>
              ),
              rowExpandable: (row) => !!row.message,
              defaultExpandAllRows: true,
            }}
          />
        </>
      )}
    </div>
  );
};

export default PayrollHistoryImport;
