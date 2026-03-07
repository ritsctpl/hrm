'use client';
import React from 'react';
import { Select, Button, Typography, Space } from 'antd';
import type { MilestoneRowProps } from '../../types/ui.types';
import type { MilestoneStatus } from '../../types/domain.types';
import MilestoneStatusBadge from '../atoms/MilestoneStatusBadge';
import { formatDate } from '../../utils/projectHelpers';
import styles from '../../styles/ProjectDetail.module.css';

const { Text } = Typography;

const MILESTONE_STATUSES: MilestoneStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];

const MilestoneRow: React.FC<MilestoneRowProps> = ({ milestone, isEditing, onStatusChange, onRemove }) => (
  <div className={styles.milestoneRow}>
    <Text style={{ flex: 1 }}>{milestone.milestoneName}</Text>
    <Text type="secondary" style={{ width: 110, fontSize: 12 }}>{formatDate(milestone.targetDate)}</Text>
    {isEditing && onStatusChange ? (
      <Select
        value={milestone.status}
        onChange={(v) => onStatusChange(milestone.milestoneId, v as MilestoneStatus)}
        style={{ width: 140 }}
        size="small"
        options={MILESTONE_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
      />
    ) : (
      <MilestoneStatusBadge status={milestone.status} />
    )}
    {milestone.description && (
      <Text type="secondary" style={{ fontSize: 11, flex: 1 }}>{milestone.description}</Text>
    )}
    {isEditing && onRemove && (
      <Button size="small" type="link" danger onClick={() => onRemove(milestone.milestoneId)}>Remove</Button>
    )}
  </div>
);

export default MilestoneRow;
