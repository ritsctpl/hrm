'use client';
import React from 'react';
import { Space, Button, Popconfirm, Typography } from 'antd';
import type { ResourceAllocation } from '../../types/domain.types';
import AllocationStatusBadge from '../atoms/AllocationStatusBadge';
import HoursDisplay from '../atoms/HoursDisplay';
import { formatDate } from '../../utils/projectHelpers';

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
          {onEdit && <Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button>}
          {onSubmit && <Button size="small" type="link" onClick={() => onSubmit(allocation)}>Submit</Button>}
          {onCancel && (
            <Popconfirm title="Cancel this allocation?" onConfirm={() => onCancel(allocation)}>
              <Button size="small" type="link" danger>Cancel</Button>
            </Popconfirm>
          )}
        </>
      )}

      {/* SUBMITTED: Cancel only */}
      {allocation.status === 'SUBMITTED' && onCancel && (
        <Popconfirm title="Cancel this allocation?" onConfirm={() => onCancel(allocation)}>
          <Button size="small" type="link" danger>Cancel</Button>
        </Popconfirm>
      )}

      {/* APPROVED: Cancel (reverses hours) */}
      {allocation.status === 'APPROVED' && onCancel && (
        <Popconfirm title="Cancel this approved allocation?" onConfirm={() => onCancel(allocation)}>
          <Button size="small" type="link" danger>Cancel</Button>
        </Popconfirm>
      )}

      {/* REJECTED: Edit + Resubmit */}
      {allocation.status === 'REJECTED' && (
        <>
          {onEdit && <Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button>}
          {onSubmit && <Button size="small" type="link" onClick={() => onSubmit(allocation)}>Resubmit</Button>}
        </>
      )}
    </Space>
  </div>
);

export default AllocationRow;
