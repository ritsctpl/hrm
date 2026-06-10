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
  hideEmployee?: boolean;
  hideHours?: boolean;
}

const isProjectLevel = (a: ResourceAllocation) => !a.taskId;
const isActive = (a: ResourceAllocation) => a.status !== 'CANCELLED' && a.status !== 'REJECTED';
const cancelTitle = (a: ResourceAllocation) =>
  isProjectLevel(a)
    ? "Cancel this allocation? This also cancels the employee's task allocations on this project."
    : 'Cancel this allocation?';

const AllocationRow: React.FC<AllocationRowProps> = ({ allocation, onEdit, onSubmit, onCancel, onAssignTask, hideEmployee, hideHours }) => (
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

      {/* SUBMITTED: Cancel only */}
      {allocation.status === 'SUBMITTED' && onCancel && (
        <Can I="delete">
          <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
            <Button size="small" type="link" danger>Cancel</Button>
          </Popconfirm>
        </Can>
      )}

      {/* APPROVED: Cancel (reverses hours) */}
      {allocation.status === 'APPROVED' && onCancel && (
        <Can I="delete">
          <Popconfirm title={cancelTitle(allocation)} onConfirm={() => onCancel(allocation)}>
            <Button size="small" type="link" danger>Cancel</Button>
          </Popconfirm>
        </Can>
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
