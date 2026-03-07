'use client';
import { Tabs } from 'antd';
import { TeamOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { useEffect } from 'react';
import { useHrmTimesheetStore } from '../../stores/hrmTimesheetStore';
import { useHrmTimesheetData } from '../../hooks/useHrmTimesheetData';
import { useHrmTimesheetUI } from '../../hooks/useHrmTimesheetUI';
import WeekNavigator from '../molecules/WeekNavigator';
import TeamTimesheetGrid from '../organisms/TeamTimesheetGrid';
import ApprovalInbox from '../organisms/ApprovalInbox';

export default function TimesheetSupervisorTemplate() {
  const { selectedWeekStart } = useHrmTimesheetStore();
  const { loadTeamTimesheets, loadPendingApprovals, loadUnplannedCategories } = useHrmTimesheetData();
  const { approveTimesheet } = useHrmTimesheetUI();

  useEffect(() => {
    void loadTeamTimesheets();
  }, [selectedWeekStart]);

  useEffect(() => {
    void loadPendingApprovals();
    void loadUnplannedCategories();
  }, []);

  const items = [
    {
      key: 'team',
      label: (
        <span>
          <TeamOutlined />
          Team View
        </span>
      ),
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
      key: 'approvals',
      label: (
        <span>
          <CheckSquareOutlined />
          Approvals
        </span>
      ),
      children: (
        <div style={{ padding: '12px 16px' }}>
          <ApprovalInbox onApprove={approveTimesheet} />
        </div>
      ),
    },
  ];

  return <Tabs items={items} />;
}
