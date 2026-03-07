'use client';

import { useEffect, useCallback } from 'react';
import { Tabs } from 'antd';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmTimesheetStore } from './stores/hrmTimesheetStore';
import { useHrmTimesheetData } from './hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from './hooks/useHrmTimesheetUI';
import WeekCalendarBar from './components/organisms/WeekCalendarBar';
import DailyTimesheetEditor from './components/organisms/DailyTimesheetEditor';
import WeeklySubmitPanel from './components/organisms/WeeklySubmitPanel';
import ApprovalInbox from './components/organisms/ApprovalInbox';
import TeamTimesheetGrid from './components/organisms/TeamTimesheetGrid';
import PayrollExportPanel from './components/organisms/PayrollExportPanel';
import ComplianceReportPanel from './components/organisms/ComplianceReportPanel';
import UnplannedWorkReportPanel from './components/organisms/UnplannedWorkReportPanel';
import HolidayWorkingReportPanel from './components/organisms/HolidayWorkingReportPanel';
import styles from './styles/HrmTimesheet.module.css';

export default function HrmTimesheetLanding() {
  const {
    activeTab,
    activeReportTab,
    selectedDate,
    selectedWeekStart,
    weeklyTimesheets,
    loadingWeek,
    setActiveTab,
    setActiveReportTab,
    setSelectedWeekStart,
  } = useHrmTimesheetStore();

  const {
    loadWeeklyTimesheets,
    loadDayTimesheet,
    loadPendingApprovals,
    loadTeamTimesheets,
    loadUnplannedCategories,
  } = useHrmTimesheetData();

  const { saveTimesheet, submitTimesheet, submitWeek, approveTimesheet, copyFromPreviousDay } =
    useHrmTimesheetUI();

  const { site } = parseCookies();

  // Load weekly data on mount and when week changes
  useEffect(() => {
    void loadWeeklyTimesheets();
    void loadUnplannedCategories();
  }, [loadWeeklyTimesheets, loadUnplannedCategories]);

  // Load day timesheet when selected date changes
  useEffect(() => {
    void loadDayTimesheet(selectedDate);
  }, [selectedDate, loadDayTimesheet]);

  // Load approval/team data when switching to those tabs
  useEffect(() => {
    if (activeTab === 'approvals') void loadPendingApprovals();
    if (activeTab === 'team') void loadTeamTimesheets();
  }, [activeTab, loadPendingApprovals, loadTeamTimesheets]);

  const navigateWeek = useCallback(
    (direction: -1 | 1) => {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() + direction * 7);
      setSelectedWeekStart(d.toISOString().slice(0, 10));
    },
    [selectedWeekStart, setSelectedWeekStart]
  );

  const reportTabs = [
    { key: 'payroll', label: 'Payroll Export', children: <PayrollExportPanel /> },
    { key: 'compliance', label: 'Compliance', children: <ComplianceReportPanel /> },
    { key: 'unplanned', label: 'Unplanned Work', children: <UnplannedWorkReportPanel /> },
    { key: 'holiday', label: 'Holiday Working', children: <HolidayWorkingReportPanel /> },
  ];

  const mainTabs = [
    {
      key: 'my',
      label: 'My Timesheet',
      children: (
        <div className={styles.timesheetLayout}>
          <WeekCalendarBar weeklyTimesheets={weeklyTimesheets} loading={loadingWeek} />
          <WeeklySubmitPanel onSubmitWeek={submitWeek} />
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
            <DailyTimesheetEditor
              onSave={saveTimesheet}
              onSubmit={submitTimesheet}
              onCopyFromPrev={copyFromPreviousDay}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'approvals',
      label: 'Approvals',
      children: <ApprovalInbox onApprove={approveTimesheet} />,
    },
    {
      key: 'team',
      label: 'Team View',
      children: (
        <div style={{ padding: '12px 16px' }}>
          <TeamTimesheetGrid />
        </div>
      ),
    },
    {
      key: 'reports',
      label: 'Reports',
      children: (
        <div style={{ padding: '12px 16px' }}>
          <Tabs
            activeKey={activeReportTab}
            onChange={(k) => setActiveReportTab(k as typeof activeReportTab)}
            items={reportTabs}
            size="small"
          />
        </div>
      ),
    },
  ];

  // Week label for AppBar subtitle
  const weekEnd = new Date(selectedWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const weekLabel = `${fmt(new Date(selectedWeekStart))} – ${fmt(weekEnd)}`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CommonAppBar appTitle={`Timesheets — ${weekLabel}`} showBack={false} />
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as typeof activeTab)}
        items={mainTabs}
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
        tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
      />
    </div>
  );
}
