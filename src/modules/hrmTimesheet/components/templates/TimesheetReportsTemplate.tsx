'use client';
import { Tabs } from 'antd';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import PayrollExportPanel from '../organisms/PayrollExportPanel';
import ComplianceReportPanel from '../organisms/ComplianceReportPanel';
import UnplannedWorkReportPanel from '../organisms/UnplannedWorkReportPanel';
import HolidayWorkingReportPanel from '../organisms/HolidayWorkingReportPanel';
import type { ReportTab } from '../../types/ui.types';

export default function TimesheetReportsTemplate() {
  const { activeReportTab, setActiveReportTab } = useHrmTimesheetStore();

  const items = [
    {
      key: 'payroll',
      label: 'Payroll Export',
      children: (
        <div style={{ padding: '12px 0' }}>
          <PayrollExportPanel />
        </div>
      ),
    },
    {
      key: 'compliance',
      label: 'Submission Compliance',
      children: (
        <div style={{ padding: '12px 0' }}>
          <ComplianceReportPanel />
        </div>
      ),
    },
    {
      key: 'unplanned',
      label: 'Unplanned Work',
      children: (
        <div style={{ padding: '12px 0' }}>
          <UnplannedWorkReportPanel />
        </div>
      ),
    },
    {
      key: 'holiday',
      label: 'Holiday Working',
      children: (
        <div style={{ padding: '12px 0' }}>
          <HolidayWorkingReportPanel />
        </div>
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeReportTab}
      onChange={(k) => setActiveReportTab(k as ReportTab)}
      items={items}
    />
  );
}
