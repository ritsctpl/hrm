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
}

const isProjectLevel = (a: ResourceAllocation) => !a.taskId;
const isActive = (a: ResourceAllocation) => a.status !== 'CANCELLED' && a.status !== 'REJECTED';
const cancelTitle = (a: ResourceAllocation) =>
  isProjectLevel(a)
    ? "Cancel this allocation? This also cancels the employee's task allocations on this project."
    : 'Cancel this allocation?';

const AllocationRow: React.FC<AllocationRowProps> = ({ allocation, onEdit, onSubmit, onCancel, onAssignTask, onReassign, onReplace, onRelease, onRevise, onRecall, onCover, hideEmployee, hideHours }) => (
  <div style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
    <Space size={12} wrap>
      {!hideEmployee && <Text strong style={{ minWidth: 140 }}>{allocation.employeeName}</Text>}
      {allocation.taskName
        ? <Tag color="blue">{allocation.taskName}</Tag>
        : <Tag>Project member</Tag>}
      {!hideHours && <HoursDisplay hours={allocation.hoursPerDay} />}
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
          {onEdit && <Can I="edit"><Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button></Can>}
          {onSubmit && <Can I="edit"><Button size="small" type="link" onClick={() => onSubmit(allocation)}>Submit</Button></Can>}
          {onCancel && (
            <Can I="delete">
              <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
                <Button size="small" type="link" danger>Cancel</Button>
              </Popconfirm>
            </Can>
          )}
        </>
      )}

      {/* SUBMITTED: Recall (back to draft) + Cancel */}
      {allocation.status === 'SUBMITTED' && (
        <>
          {onRecall && <Can I="edit"><Button size="small" type="link" onClick={() => onRecall(allocation)}>Recall</Button></Can>}
          {onCancel && (
            <Can I="delete">
              <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
                <Button size="small" type="link" danger>Cancel</Button>
              </Popconfirm>
            </Can>
          )}
        </>
      )}

      {/* APPROVED: edit/extend, reassign/replace, then Cancel (reverses hours) */}
      {allocation.status === 'APPROVED' && (
        <>
          {onRevise && <Can I="edit"><Button size="small" type="link" onClick={() => onRevise(allocation)}>Edit</Button></Can>}
          {onReassign && !!allocation.taskId && (
            <Can I="edit"><Button size="small" type="link" onClick={() => onReassign(allocation)}>Reassign</Button></Can>
          )}
          {onCover && !!allocation.taskId && (
            <Can I="edit"><Button size="small" type="link" onClick={() => onCover(allocation)}>Cover</Button></Can>
          )}
          {onReplace && isProjectLevel(allocation) && (
            <Can I="edit"><Button size="small" type="link" onClick={() => onReplace(allocation)}>Replace</Button></Can>
          )}
          {onRelease && isProjectLevel(allocation) && (
            <Can I="delete"><Button size="small" type="link" onClick={() => onRelease(allocation)}>Release</Button></Can>
          )}
          {onCancel && (
            <Can I="delete">
              <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
                <Button size="small" type="link" danger>Cancel</Button>
              </Popconfirm>
            </Can>
          )}
        </>
      )}

      {/* REJECTED: Edit + Resubmit */}
      {allocation.status === 'REJECTED' && (
        <>
          {onEdit && <Can I="edit"><Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button></Can>}
          {onSubmit && <Can I="edit"><Button size="small" type="link" onClick={() => onSubmit(allocation)}>Resubmit</Button></Can>}
        </>
      )}
    </Space>
  </div>
);

export default AllocationRow;
