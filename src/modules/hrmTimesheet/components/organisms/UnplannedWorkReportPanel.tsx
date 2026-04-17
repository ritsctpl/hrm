'use client';
import { Button, DatePicker, Form, Input, Table, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../../services/hrmTimesheetService';
import type { UnplannedWorkReport } from '../../types/api.types';
import styles from '../../styles/HrmTimesheet.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function UnplannedWorkReportPanel() {
  const {
    reportPeriodStart, reportPeriodEnd,
    setReportPeriodStart, setReportPeriodEnd,
    loadingReport, setLoadingReport,
  } = useHrmTimesheetStore();
  const organizationId = getOrganizationId();
  const [report, setReport] = useState<UnplannedWorkReport | null>(null);
  const [department, setDepartment] = useState('');

  async function handleGenerate() {
    setLoadingReport(true);
    try {
      const data = await HrmTimesheetService.getUnplannedWorkReport(organizationId, reportPeriodStart, reportPeriodEnd, department || undefined);
      setReport(data);
    } catch (err) {
      message.error('Failed to generate unplanned work report');
    } finally {
      setLoadingReport(false);
    }
  }

  const categoryColumns = [
    { title: 'Category', dataIndex: 'categoryLabel', key: 'categoryLabel' },
    { title: 'Hours', dataIndex: 'hours', key: 'hours', width: 100, align: 'right' as const, render: (v: number) => v.toFixed(1) },
    { title: '% of Unplanned', dataIndex: 'percent', key: 'percent', width: 130, align: 'right' as const, render: (v: number) => `${v.toFixed(1)}%` },
  ];

  const employeeColumns = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    { title: 'Total Hours', dataIndex: 'totalHours', key: 'totalHours', width: 110, align: 'right' as const, render: (v: number) => v.toFixed(1) },
    { title: 'Unplanned Hours', dataIndex: 'unplannedHours', key: 'unplannedHours', width: 130, align: 'right' as const, render: (v: number) => v.toFixed(1) },
    { title: 'Unplanned %', dataIndex: 'unplannedPercent', key: 'unplannedPercent', width: 120, align: 'right' as const, render: (v: number) => `${v.toFixed(1)}%` },
  ];

  return (
    <div className={styles.reportPanel}>
      <Title level={5} style={{ margin: 0 }}>Unplanned Work Analysis</Title>

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
        <Button type="primary" size="small" icon={<SearchOutlined />} onClick={handleGenerate} loading={loadingReport}>
          Generate
        </Button>
      </div>

      {report && (
        <div style={{ display: 'flex', gap: 24, padding: '8px 12px', background: '#fffbe6', borderRadius: 6 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Total Hours</Text>
            <div><Text strong>{report.totalHours.toFixed(1)}</Text></div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Unplanned Hours</Text>
            <div><Text strong style={{ color: '#faad14' }}>{report.unplannedHours.toFixed(1)}</Text></div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Unplanned %</Text>
            <div><Text strong>{report.unplannedPercent.toFixed(1)}%</Text></div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Text strong style={{ fontSize: 13 }}>By Category</Text>
          <Table
            size="small"
            dataSource={report?.byCategory ?? []}
            rowKey="categoryId"
            columns={categoryColumns}
            pagination={false}
            loading={loadingReport}
            style={{ marginTop: 8 }}
          />
        </div>
        <div style={{ flex: 2 }}>
          <Text strong style={{ fontSize: 13 }}>By Employee</Text>
          <Table
            size="small"
            dataSource={report?.byEmployee ?? []}
            rowKey="employeeId"
            columns={employeeColumns}
            pagination={{ pageSize: 10 }}
            loading={loadingReport}
            style={{ marginTop: 8 }}
          />
        </div>
      </div>
    </div>
  );
}
