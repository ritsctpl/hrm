'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, InputNumber, Progress, Space, Table, Tag, Typography, Upload, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useHrmPayrollStore } from '../../stores/payrollStore';
import { HrmPayrollService } from '../../services/payrollService';
import { getOrganizationId } from '@/utils/cookieUtils';
import { parseCookies } from 'nookies';
import {
  MONEY_COLUMNS, buildMonthlyInputTemplate, parseMonthlyInputsCsv,
  type MonthlyInputRow,
} from '../../utils/monthlyInputs';

/**
 * The month's variable inputs. fe-spec §7.
 *
 * The engine derives everything else from compensation; these are the values that genuinely change
 * month to month — the columns the source workbook itself marks "Edit only".
 *
 * A CSV upload FILLS THE GRID; it does not save. Changed cells are marked so it is obvious what came
 * from the file, and a row for someone outside this run is reported rather than dropped.
 */
const MonthlyInputsGrid: React.FC = () => {
  const store = useHrmPayrollStore();
  const [rows, setRows] = useState<MonthlyInputRow[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const seeded = useRef<string>('');

  // Seed one row per employee in the run, once the run's employee list is known.
  const seedKey = store.includedEmployeeIds.join(',');
  useMemo(() => {
    if (!seedKey || seeded.current === seedKey) return;
    seeded.current = seedKey;
    setRows(store.includedEmployeeIds.map((id) => ({
      employeeId: id,
      employeeName: id,
      lopDays: store.lopInputs[id] ?? 0,
      shiftAllowance: 0, extraWorkPay: 0, arrears: 0, incomeTax: 0, professionalTax: 0,
    })));
  }, [seedKey, store.includedEmployeeIds, store.lopInputs]);

  const setCell = useCallback((employeeId: string, key: keyof MonthlyInputRow, value: number) => {
    setRows((prev) => prev.map((r) => (r.employeeId === employeeId ? { ...r, [key]: value } : r)));
  }, []);

  const downloadTemplate = () => {
    const blob = new Blob([buildMonthlyInputTemplate(rows)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-inputs-${store.wizardRunId ?? 'run'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadProps: UploadProps = {
    accept: '.csv,text/csv',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const parsed = parseMonthlyInputsCsv(String(reader.result ?? ''),
          rows.map((r) => r.employeeId));
        if (parsed.error) { setUploadError(parsed.error); return; }
        setUploadError(null);
        setIgnored(parsed.ignored);
        setRows((prev) => prev.map((r) => {
          const u = parsed.updates[r.employeeId];
          if (!u) return r;
          const touched: Record<string, number> = {};
          (Object.keys(u) as (keyof MonthlyInputRow)[]).forEach((k) => {
            if (u[k] !== r[k]) touched[k as string] = r[k] as number;
          });
          return { ...r, ...u, touched };
        }));
      };
      reader.readAsText(file as File);
      return false;
    },
  };

  const changedRows = rows.filter((r) => r.touched && Object.keys(r.touched).length > 0);

  const save = useCallback(async () => {
    if (!store.wizardRunId) { message.error('Create the payroll run first'); return; }
    setSaving(true);
    const performedBy = parseCookies().rl_user_id ?? '';
    const jobs: (() => Promise<void>)[] = [];

    for (const row of rows) {
      jobs.push(async () => {
        await HrmPayrollService.updateLop({
          organizationId: getOrganizationId(),
          payrollRunId: store.wizardRunId as string,
          employeeId: row.employeeId,
          lopDays: row.lopDays ?? 0,
          updatedBy: performedBy,
        });
      });
      for (const col of MONEY_COLUMNS) {
        const amount = Number(row[col.key] ?? 0);
        if (!amount) continue;   // only send what was actually entered
        jobs.push(async () => {
          await HrmPayrollService.addAdjustment({
            organizationId: getOrganizationId(),
            payrollRunId: store.wizardRunId as string,
            employeeId: row.employeeId,
            adjustmentType: col.adjustmentType,
            description: col.description,
            amount,
            addedBy: performedBy,
          });
        });
      }
    }

    setProgress({ done: 0, total: jobs.length });
    let done = 0;
    const failed: string[] = [];
    // Five at a time: the backend has no bulk input endpoint, and firing 60 requests at once is
    // how a dev box starts refusing connections.
    const CONCURRENCY = 5;
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const slice = jobs.slice(i, i + CONCURRENCY);
      // eslint-disable-next-line no-await-in-loop
      const settled = await Promise.allSettled(slice.map((j) => j()));
      settled.forEach((s, n) => { if (s.status === 'rejected') failed.push(String(i + n)); });
      done += slice.length;
      setProgress({ done, total: jobs.length });
    }
    setSaving(false);
    setProgress(null);
    if (failed.length > 0) {
      message.error(`${failed.length} of ${jobs.length} updates failed — the grid is unchanged for those`);
    } else {
      setRows((prev) => prev.map((r) => ({ ...r, touched: {} })));
      message.success(`Monthly inputs saved for ${rows.length} employees`);
    }
  }, [rows, store.wizardRunId]);

  const amountCell = (key: keyof MonthlyInputRow) => (_: unknown, row: MonthlyInputRow) => {
    const fromUpload = row.touched && key in row.touched;
    return (
      <InputNumber
        size="small"
        min={0}
        value={row[key] as number}
        onChange={(v) => setCell(row.employeeId, key, typeof v === 'number' ? v : 0)}
        style={{
          width: '100%',
          borderLeft: fromUpload ? '3px solid #faad14' : undefined,
        }}
        title={fromUpload ? `From upload — was ${row.touched?.[key as string]}` : undefined}
      />
    );
  };

  const columns = [
    { title: 'Employee', dataIndex: 'employeeId', fixed: 'left' as const, width: 160 },
    { title: 'LOP days', dataIndex: 'lopDays', width: 110, render: amountCell('lopDays') },
    ...MONEY_COLUMNS.map((c) => ({
      title: c.label, dataIndex: c.key as string, width: 150, render: amountCell(c.key),
    })),
  ];

  return (
    <Card
      size="small"
      title="Monthly inputs"
      extra={
        <Space>
          <Button size="small" icon={<DownloadOutlined />} onClick={downloadTemplate}
                  disabled={rows.length === 0}>
            Download input template
          </Button>
          <Upload {...uploadProps}>
            <Button size="small" icon={<UploadOutlined />} disabled={rows.length === 0}>
              Upload filled CSV
            </Button>
          </Upload>
        </Space>
      }
      style={{ marginBottom: 12 }}
    >
      {uploadError && (
        <Alert type="error" showIcon message={uploadError} style={{ marginBottom: 12 }} />
      )}

      {changedRows.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={`${changedRows.length} employees updated from file, ${rows.length - changedRows.length} unchanged. Nothing saved yet.`}
        />
      )}

      {ignored.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Ignored: ${ignored.join(', ')} ${ignored.length === 1 ? 'is' : 'are'} not part of this run`}
        />
      )}

      <Table<MonthlyInputRow>
        size="small"
        rowKey="employeeId"
        dataSource={rows}
        columns={columns}
        pagination={false}
        scroll={{ x: 900, y: 320 }}
        locale={{ emptyText: 'No employees in this run. Go back and select a group.' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        {progress && (
          <Progress
            percent={Math.round((progress.done / progress.total) * 100)}
            size="small"
            style={{ flex: 1 }}
          />
        )}
        <Typography.Text type="secondary" style={{ marginLeft: 'auto' }}>
          {rows.length} employees
        </Typography.Text>
        <Button type="primary" loading={saving} disabled={rows.length === 0} onClick={save}>
          Save inputs
        </Button>
      </div>
    </Card>
  );
};

export default MonthlyInputsGrid;
