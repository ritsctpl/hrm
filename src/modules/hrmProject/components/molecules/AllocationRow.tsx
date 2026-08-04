'use client';
import React from 'react';
import { Space, Button, Popconfirm, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ResourceAllocation } from '../../types/domain.types';
import AllocationStatusBadge from '../atoms/AllocationStatusBadge';
import HoursDisplay from '../atoms/HoursDisplay';
import { formatDate } from '../../utils/projectHelpers';
import Can from '../../../hrmAccess/components/Can';

const { Text } = Typography;

interface AllocationRowProps {
  allocation: ResourceAllocation;
  onEdit?: (a: ResourceAllocation) => void;
  onSubmit?: (a: ResourceAllocation) => void;
  onCancel?: (a: ResourceAllocation) => void;
  onAssignTask?: (a: ResourceAllocation) => void;
  onReassign?: (a: ResourceAllocation) => void; // move a task allocation to another person
  onReplace?: (a: ResourceAllocation) => void;  // replace a project member (membership row)
  onRelease?: (a: ResourceAllocation) => void;  // release a member, no replacement (membership row)
  onRevise?: (a: ResourceAllocation) => void;   // edit/extend an approved allocation
  onRecall?: (a: ResourceAllocation) => void;   // pull a submitted allocation back to draft
  onCover?: (a: ResourceAllocation) => void;    // temporary cover for a task allocation
  hideEmployee?: boolean;
  hideHours?: boolean;
  /** Signed-in user is this project's manager. Only they may change an existing allocation. */
  isProjectManager?: boolean;
}

/** Renders children only for the project's manager — no permission grant substitutes. */
const PMOnly: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) =>
  ok ? <>{children}</> : null;

const isProjectLevel = (a: ResourceAllocation) => !a.taskId;
const isActive = (a: ResourceAllocation) => a.status !== 'CANCELLED' && a.status !== 'REJECTED';
const cancelTitle = (a: ResourceAllocation) =>
  isProjectLevel(a)
    ? "Cancel this allocation? This also cancels the employee's task allocations on this project."
    : 'Cancel this allocation?';

const AllocationRow: React.FC<AllocationRowProps> = ({ allocation, onEdit, onSubmit, onCancel, onAssignTask, onReassign, onReplace, onRelease, onRevise, onRecall, onCover, hideEmployee, hideHours, isProjectManager = false }) => (
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

      {/* Assign a task to this team member (project-level membership only) */}
      {onAssignTask && isProjectLevel(allocation) && isActive(allocation) && (
        <Can I="add">
          <Button size="small" type="link" icon={<PlusOutlined />} onClick={() => onAssignTask(allocation)}>
            Assign Task
          </Button>
        </Can>
      )}

      {/* DRAFT: Edit, Submit, Cancel */}
      {allocation.status === 'DRAFT' && (
        <>
          {onEdit && <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button></PMOnly>}
          {onSubmit && <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onSubmit(allocation)}>Submit</Button></PMOnly>}
          {onCancel && (
            <PMOnly ok={isProjectManager}>
              <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
                <Button size="small" type="link" danger>Cancel</Button>
              </Popconfirm>
            </PMOnly>
          )}
        </>
      )}

      {/* SUBMITTED: Recall (back to draft) + Cancel */}
      {allocation.status === 'SUBMITTED' && (
        <>
          {onRecall && <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onRecall(allocation)}>Recall</Button></PMOnly>}
          {onCancel && (
            <PMOnly ok={isProjectManager}>
              <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
                <Button size="small" type="link" danger>Cancel</Button>
              </Popconfirm>
            </PMOnly>
          )}
        </>
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

      {/* REJECTED: Edit + Resubmit */}
      {allocation.status === 'REJECTED' && (
        <>
          {onEdit && <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button></PMOnly>}
          {onSubmit && <PMOnly ok={isProjectManager}><Button size="small" type="link" onClick={() => onSubmit(allocation)}>Resubmit</Button></PMOnly>}
        </>
      )}
    </Space>
  </div>
);

export default AllocationRow;
