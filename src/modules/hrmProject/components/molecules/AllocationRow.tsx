'use client';
import React from 'react';
import { Space, Button, Typography } from 'antd';
import type { AllocationRowProps } from '../../types/ui.types';
import AllocationStatusBadge from '../atoms/AllocationStatusBadge';
import HoursDisplay from '../atoms/HoursDisplay';
import { formatDate } from '../../utils/projectHelpers';

const { Text } = Typography;

const AllocationRow: React.FC<AllocationRowProps> = ({ allocation, onEdit, onCancel }) => (
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
      {onEdit && allocation.status === 'DRAFT' && (
        <Button size="small" type="link" onClick={() => onEdit(allocation)}>Edit</Button>
      )}
      {onCancel && allocation.status !== 'CANCELLED' && (
        <Button size="small" type="link" danger onClick={() => onCancel(allocation)}>Cancel</Button>
      )}
    </Space>
  </div>
);

export default AllocationRow;
