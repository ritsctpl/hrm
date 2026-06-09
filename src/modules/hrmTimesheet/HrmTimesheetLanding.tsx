'use client';

import { useEffect } from 'react';
import { Breadcrumb, Button, Tabs } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmTimesheetStore } from './stores/hrmTimesheetStore';
import { useHrmTimesheetData } from './hooks/useHrmTimesheetData';
import TimesheetEmployeeTemplate from './components/templates/TimesheetEmployeeTemplate';
import TimesheetManagerTemplate from './components/templates/TimesheetManagerTemplate';
import TimesheetReportsTemplate from './components/templates/TimesheetReportsTemplate';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';

export default function HrmTimesheetLanding() {
  const { activeTab, selectedWeekStart, setActiveTab, openWeekForDate } = useHrmTimesheetStore();

  const today = dayjs().format('YYYY-MM-DD');

  const { loadWeeklyTimesheets, loadUnplannedCategories } = useHrmTimesheetData();

  // Load shared data once on mount.
  useEffect(() => {
    void loadWeeklyTimesheets();
    void loadUnplannedCategories();
  }, [loadWeeklyTimesheets, loadUnplannedCategories]);

  // Week label for AppBar subtitle
  const weekEnd = dayjs(selectedWeekStart).add(6, 'day');
  const weekLabel = `${dayjs(selectedWeekStart).format('DD MMM')} – ${weekEnd.format('DD MMM YYYY')}`;

  const crumbLabel = activeTab === 'employees' ? 'Employee TimeSheets' : 'Timesheet';

  const mainTabs = [
    {
      key: 'my',
      label: 'My Timesheets',
      children: <TimesheetEmployeeTemplate />,
    },
    {
      key: 'employees',
      label: 'Employee Timesheets',
      children: <TimesheetManagerTemplate />,
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
    <ModuleAccessGate moduleCode="HRM_TIMESHEET" appTitle="Timesheets">
      <div className="hrm-module-root">
        <CommonAppBar appTitle={`Timesheets — ${weekLabel}`} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Breadcrumb items={[{ title: 'Home' }, { title: 'Time' }, { title: crumbLabel }]} />
          {activeTab === 'my' && (
            <Button
              type="primary"
              icon={<ClockCircleOutlined />}
              onClick={() => openWeekForDate(today)}
              style={{ background: '#fadb14', borderColor: '#fadb14', color: '#262626', fontWeight: 600 }}
            >
              Enter Time
            </Button>
          )}
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as typeof activeTab)}
          items={mainTabs}
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
          style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
        />
      </div>
    </ModuleAccessGate>
  );
}
