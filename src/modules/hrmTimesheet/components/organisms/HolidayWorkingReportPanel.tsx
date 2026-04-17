'use client';
import { Button, DatePicker, Form, Table, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../../services/hrmTimesheetService';
import type { HolidayWorkingSummary } from '../../types/api.types';
import styles from '../../styles/HrmTimesheet.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function HolidayWorkingReportPanel() {
  const {
    reportPeriodStart, reportPeriodEnd,
    setReportPeriodStart, setReportPeriodEnd,
    loadingReport, setLoadingReport,
  } = useHrmTimesheetStore();
  const organizationId = getOrganizationId();
  const [report, setReport] = useState<HolidayWorkingSummary | null>(null);

  async function handleGenerate() {
    setLoadingReport(true);
    try {
      const data = await HrmTimesheetService.getHolidayWorkingSummary(organizationId, reportPeriodStart, reportPeriodEnd);
      setReport(data);
      if (!data?.entries?.length) message.info('No holiday working entries for this period');
    } catch (err) {
      message.error('Failed to generate holiday working report');
    } finally {
      setLoadingReport(false);
    }
  }

  const columns = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
    { title: 'Holiday', dataIndex: 'holidayName', key: 'holidayName' },
    {
      title: 'Hours Worked',
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      width: 120,
      align: 'right' as const,
      render: (v: number) => v.toFixed(1),
    },
    {
      title: 'Project',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 130,
      render: (v: string) => v ?? '—',
    },
  ];

  const totalHours = report?.entries.reduce((s, e) => s + e.hoursWorked, 0) ?? 0;

  return (
    <div className={styles.reportPanel}>
      <Title level={5} style={{ margin: 0 }}>Holiday Working Summary</Title>

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
        <Button type="primary" size="small" icon={<SearchOutlined />} onClick={handleGenerate} loading={loadingReport}>
          Generate
        </Button>
      </div>

      {report && report.entries.length > 0 && (
        <div style={{ padding: '8px 12px', background: '#fff7e6', borderRadius: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Total Holiday Working Hours</Text>
          <div><Text strong style={{ color: '#d46b08' }}>{totalHours.toFixed(1)} h</Text></div>
        </div>
      )}

      <div className={styles.reportTableContainer}>
        <Table
          size="small"
          dataSource={report?.entries ?? []}
          rowKey={(r) => `${r.employeeId}-${r.date}`}
          columns={columns}
          pagination={{ pageSize: 20 }}
          loading={loadingReport}
          summary={(pageData) => {
            const sum = pageData.reduce((s, r) => s + r.hoursWorked, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>Page Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong>{sum.toFixed(1)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
              </Table.Summary.Row>
            );
          }}
        />
      </div>
    </div>
  );
}
