'use client';
import React from 'react';
import { Space, Button, Popconfirm, Typography } from 'antd';
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
}

const AllocationRow: React.FC<AllocationRowProps> = ({ allocation, onEdit, onSubmit, onCancel }) => (
  <div style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
    <Space size={12} wrap>
      <Text strong style={{ minWidth: 140 }}>{allocation.employeeName}</Text>
      <HoursDisplay hours={allocation.hoursPerDay} />
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatDate(allocation.startDate)} – {formatDate(allocation.endDate)}
      </Text>
      {allocation.recurrencePattern && (
        <Text type="secondary" style={{ fontSize: 12 }}>{allocation.recurrencePattern}</Text>
      )}
      <AllocationStatusBadge status={allocation.status} />

      {/* DRAFT: Edit, Submit, Cancel */}
      {allocation.status === 'DRAFT' && (
        <>
          {onEdit && <Can I="edit"><Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button></Can>}
          {onSubmit && <Can I="edit"><Button size="small" type="link" onClick={() => onSubmit(allocation)}>Submit</Button></Can>}
          {onCancel && (
            <Can I="delete">
              <Popconfirm title="Cancel this allocation?" onConfirm={() => onCancel(allocation)}>
                <Button size="small" type="link" danger>Cancel</Button>
              </Popconfirm>
            </Can>
          )}
        </>
      )}

      {/* SUBMITTED: Cancel only */}
      {allocation.status === 'SUBMITTED' && onCancel && (
        <Can I="delete">
          <Popconfirm title="Cancel this allocation?" onConfirm={() => onCancel(allocation)}>
            <Button size="small" type="link" danger>Cancel</Button>
          </Popconfirm>
        </Can>
      )}

      {/* APPROVED: Cancel (reverses hours) */}
      {allocation.status === 'APPROVED' && onCancel && (
        <Can I="delete">
          <Popconfirm title="Cancel this approved allocation?" onConfirm={() => onCancel(allocation)}>
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
