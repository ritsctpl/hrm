'use client';
import React from 'react';
import { Space, Button, Popconfirm, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ResourceAllocation } from '../../types/domain.types';
import AllocationStatusBadge from '../atoms/AllocationStatusBadge';
import HoursDisplay from '../atoms/HoursDisplay';
import { formatDate } from '../../utils/projectHelpers';

const { Text } = Typography;

interface AllocationRowProps {
  allocation: ResourceAllocation;
  onCancel?: (a: ResourceAllocation) => void;
  onAssignTask?: (a: ResourceAllocation) => void;
  onReassign?: (a: ResourceAllocation) => void; // move a task allocation to another person
  onReplace?: (a: ResourceAllocation) => void;  // replace a project member (membership row)
  onRelease?: (a: ResourceAllocation) => void;  // release a member, no replacement (membership row)
  onRevise?: (a: ResourceAllocation) => void;   // edit/extend an allocation
  onCover?: (a: ResourceAllocation) => void;    // temporary cover for a task allocation
  onDelete?: (a: ResourceAllocation) => void;   // remove the row entirely (cancel keeps it)
  hideEmployee?: boolean;
  hideHours?: boolean;
  /** Signed-in user is this project's manager. Only they may change an existing allocation. */
  isProjectManager?: boolean;
}

/** Renders children only for the project's manager — no permission grant substitutes. */
const PMOnly: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) =>
  ok ? <>{children}</> : null;

const isProjectLevel = (a: ResourceAllocation) => !a.taskId;
// The status union is exactly APPROVED | CANCELLED, so this is the complement of the
// `status === 'APPROVED'` test that gates the manager actions below.
const isActive = (a: ResourceAllocation) => a.status !== 'CANCELLED';
const cancelTitle = (a: ResourceAllocation) =>
  isProjectLevel(a)
    ? "Cancel this member's allocation? Their task assignments on this project are cancelled too. "
      + 'The rows stay visible as cancelled — use Delete to remove them.'
    : 'Cancel this task assignment? It stays visible as cancelled — use Delete to remove it.';

const AllocationRow: React.FC<AllocationRowProps> = ({ allocation, onCancel, onAssignTask, onReassign, onReplace, onRelease, onRevise, onCover, onDelete, hideEmployee, hideHours, isProjectManager = false }) => (
  <div style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
    <Space size={12} wrap>
      {!hideEmployee && <Text strong style={{ minWidth: 140 }}>{allocation.employeeName}</Text>}
      {allocation.taskName
        ? <Tag color="blue">{allocation.taskName}</Tag>
        : <Tag>Project member</Tag>}
      {/* Only a project-level allocation books time; a task assignment has none to show. */}
      {!hideHours && !allocation.taskId && <HoursDisplay hours={allocation.hoursPerDay} />}
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatDate(allocation.startDate)} – {formatDate(allocation.endDate)}
      </Text>
      {allocation.recurrencePattern && (
        <Text type="secondary" style={{ fontSize: 12 }}>{allocation.recurrencePattern}</Text>
      )}
      <AllocationStatusBadge status={allocation.status} />

      {/* A cancelled row stays on the project as the record of what was called off.
          Delete is the way to take it away for good. */}
      {onDelete && !isActive(allocation) && (
        <PMOnly ok={isProjectManager}>
          <Popconfirm
            title={isProjectLevel(allocation)
              ? 'Delete this member from the project? Their task assignments are deleted with it. This cannot be undone.'
              : 'Delete this task assignment? This cannot be undone.'}
            okText="Delete"
            okType="danger"
            cancelText="Keep"
            onConfirm={() => onDelete(allocation)}
          >
            <Button size="small" type="link" danger>Delete</Button>
          </Popconfirm>
        </PMOnly>
      )}

      {/* Assign a task to this team member (project-level membership only) */}
      {onAssignTask && isProjectLevel(allocation) && isActive(allocation) && (
        <PMOnly ok={isProjectManager}>
          <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => onAssignTask(allocation)}>
            Assign Task
          </Button>
        </PMOnly>
      )}

      {/* APPROVED: edit/extend, reassign/replace, then Cancel (reverses hours) */}
      {allocation.status === 'APPROVED' && (
        <>
          {onRevise && <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onRevise(allocation)}>Edit</Button></PMOnly>}
          {onReassign && !!allocation.taskId && (
            <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onReassign(allocation)}>Reassign</Button></PMOnly>
          )}
          {onCover && !!allocation.taskId && (
            <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onCover(allocation)}>Cover</Button></PMOnly>
          )}
          {onReplace && isProjectLevel(allocation) && (
            <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onReplace(allocation)}>Replace</Button></PMOnly>
          )}
          {onRelease && isProjectLevel(allocation) && (
            <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onRelease(allocation)}>Release</Button></PMOnly>
          )}
          {onCancel && (
            <PMOnly ok={isProjectManager}>
              <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
                <Button size="small" type="link" danger>Cancel</Button>
              </Popconfirm>
            </PMOnly>
          )}
        </>
      )}
    </Space>
  </div>
);

export default AllocationRow;
