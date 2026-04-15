'use client';
import { Button, DatePicker, Form, Input, Progress, Table, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { parseCookies } from 'nookies';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../../services/hrmTimesheetService';
import type { SubmissionComplianceReport } from '../../types/api.types';
import styles from '../../styles/HrmTimesheet.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function ComplianceReportPanel() {
  const {
    reportPeriodStart, reportPeriodEnd,
    setReportPeriodStart, setReportPeriodEnd,
    loadingReport, setLoadingReport,
  } = useHrmTimesheetStore();
  const { site } = parseCookies();
  const [report, setReport] = useState<SubmissionComplianceReport | null>(null);
  const [department, setDepartment] = useState('');

  async function handleGenerate() {
    setLoadingReport(true);
    try {
      const data = await HrmTimesheetService.getComplianceReport(site, reportPeriodStart, reportPeriodEnd, department || undefined);
      setReport(data);
    } catch (err) {
      message.error('Failed to generate compliance report');
    } finally {
      setLoadingReport(false);
    }
  }

  const columns = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    { title: 'Working Days', dataIndex: 'workingDays', key: 'workingDays', width: 110, align: 'center' as const },
    { title: 'Submitted', dataIndex: 'submittedDays', key: 'submittedDays', width: 90, align: 'center' as const },
    { title: 'Approved', dataIndex: 'approvedDays', key: 'approvedDays', width: 90, align: 'center' as const },
    {
      title: 'Full Days', key: 'green', width: 90, align: 'center' as const,
      render: (_: unknown, r: SubmissionComplianceReport['employeeCompliance'][number]) => (
        <Text style={{ color: '#52c41a' }}>{r.greenDays}</Text>
      ),
    },
    {
      title: 'Partial', key: 'yellow', width: 80, align: 'center' as const,
      render: (_: unknown, r: SubmissionComplianceReport['employeeCompliance'][number]) => (
        <Text style={{ color: '#faad14' }}>{r.yellowDays}</Text>
      ),
    },
    {
      title: 'Low', key: 'red', width: 70, align: 'center' as const,
      render: (_: unknown, r: SubmissionComplianceReport['employeeCompliance'][number]) => (
        <Text style={{ color: '#ff4d4f' }}>{r.redDays}</Text>
      ),
    },
    {
      title: 'Compliance',
      key: 'compliance',
      width: 160,
      render: (_: unknown, r: SubmissionComplianceReport['employeeCompliance'][number]) => (
        <Progress
          percent={Math.round(r.compliancePercent)}
          size="small"
          strokeColor={r.compliancePercent >= 90 ? '#52c41a' : r.compliancePercent >= 70 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
  ];

  return (
    <div className={styles.reportPanel}>
      <Title level={5} style={{ margin: 0 }}>Submission Compliance</Title>

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
        <div style={{ padding: '8px 12px', background: '#f6ffed', borderRadius: 6, display: 'flex', gap: 24 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Overall Compliance</Text>
            <div>
              <Progress
                percent={Math.round(report.overallCompliancePercent)}
                size="small"
                style={{ width: 200 }}
              />
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Working Days</Text>
            <div><Text strong>{report.workingDays}</Text></div>
          </div>
        </div>
      )}

      <div className={styles.reportTableContainer}>
        <Table
          size="small"
          dataSource={report?.employeeCompliance ?? []}
          rowKey="employeeId"
          columns={columns}
          pagination={{ pageSize: 20 }}
          loading={loadingReport}
        />
      </div>
    </div>
  );
}
