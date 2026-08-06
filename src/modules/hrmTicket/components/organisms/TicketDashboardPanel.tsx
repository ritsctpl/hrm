'use client';

import React from 'react';
import { Button, DatePicker, Empty, Select, Space, Spin, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import StatTile from '../atoms/StatTile';
import TicketStatusTag from '../atoms/TicketStatusTag';
import SlaBadge from '../atoms/SlaBadge';
import type {
  TicketAgentLoad,
  TicketDashboard,
  TicketSummary,
  TicketSupportGroup,
} from '../../types/domain.types';
import { displayNameOnly, formatRelative } from '../../utils/ticketHelpers';

interface Props {
  dashboard: TicketDashboard | null;
  loading: boolean;
  supportGroups: TicketSupportGroup[];
  groupCode?: string;
  range: [Dayjs, Dayjs];
  onGroupChange: (code?: string) => void;
  onRangeChange: (range: [Dayjs, Dayjs]) => void;
  onReload: () => void;
  onOpenTicket: (ticketNumber: string) => void;
}

/**
 * The helpdesk at a glance.
 *
 * Every figure is over the selected window except the two marked "now" — open and unassigned are
 * current state, not window totals, and reporting them as though they belonged to the window is how
 * a backlog that has been growing for months reads as a good week.
 */
const TicketDashboardPanel: React.FC<Props> = ({
  dashboard,
  loading,
  supportGroups,
  groupCode,
  range,
  onGroupChange,
  onRangeChange,
  onReload,
  onOpenTicket,
}) => {
  const agentColumns: ColumnsType<TicketAgentLoad> = [
    {
      title: 'Agent',
      dataIndex: 'employeeName',
      render: (value: string, row) => (
        <span style={{ fontSize: 12 }}>{displayNameOnly(value || row.employeeCode)}</span>
      ),
    },
    { title: 'Open', dataIndex: 'openCount', width: 80 },
    {
      title: 'Breached',
      dataIndex: 'breachedCount',
      width: 100,
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#cf1322' : undefined }}>{value}</span>
      ),
    },
    { title: 'Resolved', dataIndex: 'resolvedInWindow', width: 100 },
  ];

  const oldestColumns: ColumnsType<TicketSummary> = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      width: 110,
      render: (value: string) => (
        <Typography.Link style={{ fontSize: 12 }} onClick={() => onOpenTicket(value)}>
          {value}
        </Typography.Link>
      ),
    },
    { title: 'Subject', dataIndex: 'subject', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (_, row) => <TicketStatusTag status={row.status} size="small" />,
    },
    {
      title: 'Age',
      dataIndex: 'createdAt',
      width: 110,
      render: (value: string) => (
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatRelative(value)}</span>
      ),
    },
    {
      title: 'SLA',
      dataIndex: 'minutesToResolutionDue',
      width: 130,
      render: (_, row) => (
        <SlaBadge
          minutesRemaining={row.minutesToResolutionDue}
          dueAt={row.resolutionDueAt}
          breached={row.resolutionSlaBreached || row.responseSlaBreached}
          paused={row.slaClockPaused}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%', background: '#fafafa' }}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          size="small"
          placeholder="All groups"
          value={groupCode}
          onChange={onGroupChange}
          options={supportGroups.map((g) => ({ value: g.groupCode, label: g.name }))}
          style={{ minWidth: 180 }}
        />
        <DatePicker.RangePicker
          size="small"
          value={range}
          allowClear={false}
          onChange={(value) => {
            if (value && value[0] && value[1]) onRangeChange([value[0], value[1]]);
          }}
          disabledDate={(current) => current && current > dayjs().endOf('day')}
        />
        <Button size="small" icon={<ReloadOutlined />} onClick={onReload} />
      </Space>

      {loading && !dashboard ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : !dashboard ? (
        <Empty description="No dashboard data" />
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <StatTile label="Raised" value={dashboard.totalRaised} hint="in this window" />
            <StatTile label="Resolved" value={dashboard.totalResolved} hint="in this window" />
            <StatTile
              label="Open now"
              value={dashboard.currentlyOpen}
              hint="current state, not the window"
              tone={dashboard.currentlyOpen > dashboard.totalResolved ? 'warn' : 'default'}
            />
            <StatTile
              label="Unassigned now"
              value={dashboard.currentlyUnassigned}
              hint="nobody has picked these up"
              tone={dashboard.currentlyUnassigned > 0 ? 'warn' : 'good'}
            />
            <StatTile
              label="SLA compliance"
              value={
                dashboard.slaCompliancePercent === null ||
                dashboard.slaCompliancePercent === undefined
                  ? '—'
                  : `${dashboard.slaCompliancePercent}%`
              }
              hint="of tickets resolved in time"
              tone={
                dashboard.slaCompliancePercent === null ||
                dashboard.slaCompliancePercent === undefined
                  ? 'default'
                  : dashboard.slaCompliancePercent >= 90
                    ? 'good'
                    : dashboard.slaCompliancePercent >= 75
                      ? 'warn'
                      : 'bad'
              }
            />
            <StatTile
              label="Avg first response"
              value={
                dashboard.avgFirstResponseHours === null ||
                dashboard.avgFirstResponseHours === undefined
                  ? '—'
                  : `${dashboard.avgFirstResponseHours} h`
              }
            />
            <StatTile
              label="Avg resolution"
              value={
                dashboard.avgResolutionHours === null || dashboard.avgResolutionHours === undefined
                  ? '—'
                  : `${dashboard.avgResolutionHours} h`
              }
              hint="excludes time on hold"
              tooltip="Time spent waiting on the requester or a third party is subtracted, so a queue is not judged on delay it did not cause."
            />
            <StatTile
              label="Reopen rate"
              value={
                dashboard.reopenRatePercent === null || dashboard.reopenRatePercent === undefined
                  ? '—'
                  : `${dashboard.reopenRatePercent}%`
              }
              hint="resolutions that came back"
              tone={
                dashboard.reopenRatePercent && dashboard.reopenRatePercent > 15 ? 'warn' : 'default'
              }
            />
            <StatTile
              label="Satisfaction"
              value={
                dashboard.avgSatisfactionRating === null ||
                dashboard.avgSatisfactionRating === undefined
                  ? '—'
                  : `${dashboard.avgSatisfactionRating} / 5`
              }
            />
            <StatTile
              label="SLA breaches"
              value={dashboard.resolutionBreaches + dashboard.responseBreaches}
              hint={`${dashboard.responseBreaches} response · ${dashboard.resolutionBreaches} resolution`}
              tone={
                dashboard.resolutionBreaches + dashboard.responseBreaches > 0 ? 'bad' : 'good'
              }
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: '1 1 340px', background: '#fff', borderRadius: 6, padding: 12 }}>
              <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>
                Agent workload
              </Typography.Text>
              <Table<TicketAgentLoad>
                rowKey="employeeCode"
                size="small"
                columns={agentColumns}
                dataSource={dashboard.agentLoad ?? []}
                pagination={false}
                style={{ marginTop: 8 }}
                locale={{ emptyText: 'Nothing assigned' }}
              />
            </div>

            <div style={{ flex: '2 1 480px', background: '#fff', borderRadius: 6, padding: 12 }}>
              <Typography.Text style={{ fontSize: 13, fontWeight: 600 }}>
                Oldest open tickets
              </Typography.Text>
              <Table<TicketSummary>
                rowKey="ticketNumber"
                size="small"
                columns={oldestColumns}
                dataSource={dashboard.oldestOpen ?? []}
                pagination={false}
                style={{ marginTop: 8 }}
                locale={{ emptyText: 'Nothing open' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TicketDashboardPanel;
