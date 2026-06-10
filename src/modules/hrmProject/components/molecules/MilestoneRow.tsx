'use client';
import React from 'react';
import { Select, Button, Typography, Popconfirm, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { MilestoneRowProps } from '../../types/ui.types';
import type { MilestoneStatus } from '../../types/domain.types';
import { formatDate } from '../../utils/projectHelpers';
import Can from '../../../hrmAccess/components/Can';
import styles from '../../styles/ProjectDetail.module.css';

const { Text } = Typography;

const MILESTONE_STATUSES: MilestoneStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];

const MilestoneRow: React.FC<MilestoneRowProps> = ({ milestone, onStatusChange, onEdit, onRemove }) => (
  <div className={styles.milestoneRow}>
    <Text ellipsis={{ tooltip: milestone.milestoneName }}>{milestone.milestoneName}</Text>
    <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(milestone.targetDate)}</Text>
    {onStatusChange ? (
      <Select
        value={milestone.status}
        onChange={(v) => onStatusChange(milestone.milestoneId, v as MilestoneStatus)}
        style={{ width: '100%' }}
        size="small"
        options={MILESTONE_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
      />
    ) : (
      <Text>{milestone.status.replace('_', ' ')}</Text>
    )}
    <Text type="secondary" style={{ fontSize: 11 }} ellipsis={{ tooltip: milestone.description }}>
      {milestone.description || '—'}
    </Text>
    <div style={{ textAlign: 'right' }}>
      {onEdit && (
        <Can I="edit">
          <Tooltip title="Edit"><Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(milestone)} /></Tooltip>
        </Can>
      )}
      {onRemove && (
        <Can I="delete">
          <Popconfirm title="Remove this milestone?" onConfirm={() => onRemove(milestone.milestoneId)}>
            <Tooltip title="Remove"><Button size="small" type="link" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Can>
      )}
    </div>
  </div>
);

export default MilestoneRow;
