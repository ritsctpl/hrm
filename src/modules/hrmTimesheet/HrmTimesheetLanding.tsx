'use client';

import { useEffect } from 'react';
import { Tabs } from 'antd';
import dayjs from 'dayjs';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmTimesheetStore } from './stores/hrmTimesheetStore';
import { useHrmTimesheetData } from './hooks/useHrmTimesheetData';
import TimesheetEmployeeTemplate from './components/templates/TimesheetEmployeeTemplate';
import TimesheetSupervisorTemplate from './components/templates/TimesheetSupervisorTemplate';
import TeamTimesheetGrid from './components/organisms/TeamTimesheetGrid';
import WeekNavigator from './components/molecules/WeekNavigator';
import TimesheetReportsTemplate from './components/templates/TimesheetReportsTemplate';
import styles from './styles/HrmTimesheet.module.css';

export default function HrmTimesheetLanding() {
  const {
    activeTab,
    selectedWeekStart,
    setActiveTab,
  } = useHrmTimesheetStore();

  const {
    loadWeeklyTimesheets,
    loadUnplannedCategories,
    loadPendingApprovals,
    loadTeamTimesheets,
  } = useHrmTimesheetData();

  // Load initial data
  useEffect(() => {
    void loadWeeklyTimesheets();
    void loadUnplannedCategories();
  }, [loadWeeklyTimesheets, loadUnplannedCategories]);

  // Load approval/team data when switching to those tabs
  useEffect(() => {
    if (activeTab === 'approvals') void loadPendingApprovals();
    if (activeTab === 'team') void loadTeamTimesheets();
  }, [activeTab, loadPendingApprovals, loadTeamTimesheets]);

  // Week label for AppBar subtitle
  const weekEnd = dayjs(selectedWeekStart).add(6, 'day');
  const weekLabel = `${dayjs(selectedWeekStart).format('DD MMM')} \u2013 ${weekEnd.format('DD MMM YYYY')}`;

  const mainTabs = [
    {
      key: 'my',
      label: 'My Timesheets',
      children: <TimesheetEmployeeTemplate />,
    },
    {
      key: 'approvals',
      label: 'Approvals',
      children: <TimesheetSupervisorTemplate />,
    },
    {
      key: 'team',
      label: 'Team',
      children: (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ marginBottom: 12 }}>
            <WeekNavigator />
          </div>
          <TeamTimesheetGrid />
        </div>
      ),
    },
    {
      key: 'reports',
      label: 'Reports & Admin',
      children: (
        <div style={{ padding: '12px 16px' }}>
          <TimesheetReportsTemplate />
        </div>
      ),
    },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CommonAppBar appTitle={`Timesheets \u2014 ${weekLabel}`} />
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as typeof activeTab)}
        items={mainTabs}
        size="small"
        tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
      />
    </div>
  );
}
