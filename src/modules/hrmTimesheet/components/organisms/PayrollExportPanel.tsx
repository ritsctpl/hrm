'use client';
import { Button, DatePicker, Form, Input, Table, Typography } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../../services/hrmTimesheetService';
import type { PayrollExportRow } from '../../types/api.types';
import styles from '../../styles/HrmTimesheet.module.css';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// Match the Reports smart-table: sticky header, body scrolls, no pagination.
const TABLE_SCROLL = { x: 'max-content' as const, y: 'calc(100vh - 360px)' };
const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

export default function PayrollExportPanel() {
  const {
    reportPeriodStart, reportPeriodEnd,
    setReportPeriodStart, setReportPeriodEnd,
    loadingReport, setLoadingReport,
  } = useHrmTimesheetStore();
  const organizationId = getOrganizationId();
  const [rows, setRows] = useState<PayrollExportRow[]>([]);
  const [department, setDepartment] = useState('');

  async function handleGenerate() {
    setLoadingReport(true);
    try {
      const data = await HrmTimesheetService.exportPayroll(organizationId, reportPeriodStart, reportPeriodEnd, department || undefined);
      setRows(data);
      if (data.length === 0) message.info('No data for selected period');
    } catch (err) {
      message.error('Failed to generate report');
    } finally {
      setLoadingReport(false);
    }
  }

  const columns = [
    { title: 'Employee ID', dataIndex: 'employeeId', key: 'employeeId', width: 120, sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.employeeId || '').localeCompare(b.employeeId || '') },
    { title: 'Employee Name', dataIndex: 'employeeName', key: 'employeeName', sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.employeeName || '').localeCompare(b.employeeName || '') },
    {
      title: 'Department', dataIndex: 'department', key: 'department',
      filters: uniq(rows.map((r) => r.department).filter(Boolean) as string[]).map((d) => ({ text: d, value: d })),
      onFilter: (v: string | number | boolean, r: PayrollExportRow) => r.department === v,
    },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110, sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.date || '').localeCompare(b.date || '') },
    { title: 'Total Hours', dataIndex: 'totalHours', key: 'totalHours', width: 110, align: 'right' as const, sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.totalHours || 0) - (b.totalHours || 0), render: (v: number) => v.toFixed(1) },
    { title: 'Allocated', dataIndex: 'allocatedHours', key: 'allocatedHours', width: 100, align: 'right' as const, sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.allocatedHours || 0) - (b.allocatedHours || 0), render: (v: number) => v?.toFixed(1) ?? '—' },
    { title: 'Unplanned', dataIndex: 'unplannedHours', key: 'unplannedHours', width: 100, align: 'right' as const, sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.unplannedHours || 0) - (b.unplannedHours || 0), render: (v: number) => v?.toFixed(1) ?? '—' },
    { title: 'Leave', dataIndex: 'leaveHours', key: 'leaveHours', width: 80, align: 'right' as const, sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.leaveHours || 0) - (b.leaveHours || 0), render: (v: number) => v?.toFixed(1) ?? '—' },
    { title: 'Holiday Working', dataIndex: 'holidayWorkingHours', key: 'holidayWorkingHours', width: 130, align: 'right' as const, sorter: (a: PayrollExportRow, b: PayrollExportRow) => (a.holidayWorkingHours || 0) - (b.holidayWorkingHours || 0), render: (v: number) => v?.toFixed(1) ?? '—' },
  ];

  return (
    <div className={styles.reportPanel}>
      <Title level={5} style={{ margin: 0 }}>Payroll Export</Title>

      <div className={styles.reportFilterBar}>
        <Form.Item label="Period" style={{ margin: 0 }}>
          <RangePicker
            size="small"
            value={[dayjs(reportPeriodStart), dayjs(reportPeriodEnd)]}
            onChange={(dates) => {
              if (dates?.[0]) setReportPeriodStart(dates[0].format('YYYY-MM-DD'));
              if (dates?.[1]) setReportPeriodEnd(dates[1].format('YYYY-MM-DD'));
            }}
          />
        </Form.Item>
        <Form.Item label="Department" style={{ margin: 0 }}>
          <Input
            size="small"
            placeholder="All"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ width: 140 }}
          />
        </Form.Item>
        <Button
          type="primary"
          size="small"
          icon={<SearchOutlined />}
          onClick={handleGenerate}
          loading={loadingReport}
        >
          Generate
        </Button>
        {rows.length > 0 && (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={async () => {
              try {
                const csv = await HrmTimesheetService.exportCsv(organizationId, reportPeriodStart, reportPeriodEnd, department || undefined);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `payroll-export-${reportPeriodStart}-to-${reportPeriodEnd}.csv`;
                link.click();
                URL.revokeObjectURL(url);
                message.success('CSV downloaded');
              } catch {
                message.error('Failed to export CSV');
              }
            }}
          >
            Export CSV
          </Button>
        )}
      </div>

      <div className={styles.reportTableContainer}>
        <Table
          size="small"
          dataSource={rows}
          rowKey={(r) => `${r.employeeId}-${r.date}`}
          columns={columns}
          pagination={false}
          scroll={TABLE_SCROLL}
          sticky
          loading={loadingReport}
          summary={(pageData) => {
            const total = pageData.reduce((s, r) => s + r.totalHours, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>{total.toFixed(1)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={3} />
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    </div>
  );
}
