'use client';

import React from 'react';
import { Button, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, MessageOutlined, PaperClipOutlined, RedoOutlined } from '@ant-design/icons';
import TicketStatusTag from '../atoms/TicketStatusTag';
import TicketPriorityTag from '../atoms/TicketPriorityTag';
import SlaBadge from '../atoms/SlaBadge';
import type { TicketSummary } from '../../types/domain.types';
import { displayNameOnly, formatRelative } from '../../utils/ticketHelpers';

interface Props {
  rows: TicketSummary[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onOpen: (ticketNumber: string) => void;
  /** Rendered as an extra column when the viewer agents for this queue. */
  onClaim?: (ticketNumber: string) => void;
  claiming?: boolean;
  showRequester?: boolean;
  showAssignee?: boolean;
  emptyText?: string;
}

const TicketTable: React.FC<Props> = ({
  rows,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onOpen,
  onClaim,
  claiming,
  showRequester = true,
  showAssignee = true,
  emptyText = 'No tickets',
}) => {
  const columns: ColumnsType<TicketSummary> = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      width: 110,
      render: (value: string) => (
        <Typography.Link onClick={() => onOpen(value)} style={{ fontSize: 12, fontWeight: 600 }}>
          {value}
        </Typography.Link>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      ellipsis: true,
      render: (value: string, row) => (
        <div style={{ minWidth: 0 }}>
          <Typography.Link
            onClick={() => onOpen(row.ticketNumber)}
            ellipsis
            style={{ fontSize: 13, color: '#262626' }}
          >
            {value}
          </Typography.Link>
          <div style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', gap: 10, marginTop: 2 }}>
            <span>{row.categoryName ?? row.categoryCode ?? '—'}</span>
            {row.commentCount ? (
              <span>
                <MessageOutlined /> {row.commentCount}
              </span>
            ) : null}
            {row.attachmentCount ? (
              <span>
                <PaperClipOutlined /> {row.attachmentCount}
              </span>
            ) : null}
            {row.reopenCount ? (
              <Tooltip title={`Reopened ${row.reopenCount} time(s)`}>
                <span style={{ color: '#cf1322' }}>
                  <RedoOutlined /> {row.reopenCount}
                </span>
              </Tooltip>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (_, row) => <TicketStatusTag status={row.status} size="small" />,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 100,
      render: (_, row) => <TicketPriorityTag priority={row.priority} />,
    },
    ...(showRequester
      ? ([
          {
            title: 'Raised by',
            dataIndex: 'raisedByName',
            width: 150,
            ellipsis: true,
            render: (value: string) => (
              <span style={{ fontSize: 12 }}>{displayNameOnly(value)}</span>
            ),
          },
        ] as ColumnsType<TicketSummary>)
      : []),
    ...(showAssignee
      ? ([
          {
            title: 'Assigned to',
            dataIndex: 'assignedToName',
            width: 150,
            ellipsis: true,
            render: (value: string) =>
              value ? (
                <span style={{ fontSize: 12 }}>{displayNameOnly(value)}</span>
              ) : (
                <span style={{ fontSize: 12, color: '#bfbfbf' }}>Unassigned</span>
              ),
          },
        ] as ColumnsType<TicketSummary>)
      : []),
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
    {
      title: 'Activity',
      dataIndex: 'lastActivityAt',
      width: 110,
      render: (value: string) => (
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{formatRelative(value)}</span>
      ),
    },
    {
      // An explicit action, not just a link on the number. A row whose only affordance is
      // underlined text reads as a label, and people asked where the "view" button was.
      title: '',
      key: 'view',
      width: onClaim ? 150 : 80,
      fixed: 'right',
      render: (_: unknown, row: TicketSummary) => (
        <Space size={4}>
          <Tooltip title="Open ticket">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onOpen(row.ticketNumber)}>
              View
            </Button>
          </Tooltip>
          {onClaim && !row.assignedToCode ? (
            <Button size="small" loading={claiming} onClick={() => onClaim(row.ticketNumber)}>
              Claim
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Table<TicketSummary>
      rowKey="ticketNumber"
      size="small"
      columns={columns}
      dataSource={rows}
      loading={loading}
      locale={{ emptyText }}
      scroll={{ x: 'max-content', y: 'calc(100vh - 340px)' }}
      // Server-side paging: the table reports a 1-based page, the store keeps the 0-based one the
      // backend expects, and the conversion lives here rather than in three call sites.
      pagination={{
        current: page + 1,
        pageSize,
        total,
        size: 'small',
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (count) => `${count} ticket${count === 1 ? '' : 's'}`,
        onChange: (nextPage, nextSize) => onPageChange(nextPage - 1, nextSize),
      }}
      // A breached row is visually distinct from the rest so a queue can be triaged without
      // reading the SLA column on every line.
      rowClassName={(row) =>
        row.resolutionSlaBreached || row.responseSlaBreached ? 'hrm-ticket-row-breached' : ''
      }
    />
  );
};

export default TicketTable;
