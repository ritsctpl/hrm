'use client';
import React from 'react';
import { Select, Button, Typography, Popconfirm, Tooltip, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { MilestoneRowProps } from '../../types/ui.types';
import type { MilestoneStatus } from '../../types/domain.types';
import { formatDate } from '../../utils/projectHelpers';
import styles from '../../styles/ProjectDetail.module.css';

const { Text } = Typography;

const MILESTONE_STATUSES: MilestoneStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];

/** Renders children only for the project's manager — no permission grant substitutes. */
const PMOnly: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) =>
  ok ? <>{children}</> : null;

const MilestoneRow: React.FC<MilestoneRowProps> = ({ milestone, taskRollup, onStatusChange, onEdit, onRemove, isProjectManager = false }) => (
  <div className={styles.milestoneRow}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <Text ellipsis={{ tooltip: milestone.milestoneName }}>{milestone.milestoneName}</Text>
      {taskRollup && taskRollup.total > 0 && (
        <Tooltip title={`${taskRollup.done} of ${taskRollup.total} linked tasks complete`}>
          <Tag color={taskRollup.done === taskRollup.total ? 'green' : 'blue'} style={{ flexShrink: 0 }}>
            {taskRollup.done}/{taskRollup.total}
          </Tag>
        </Tooltip>
      )}
    </span>
    <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(milestone.targetDate)}</Text>
    {onStatusChange && isProjectManager ? (
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
        <PMOnly ok={isProjectManager}>
          <Tooltip title="Edit"><Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(milestone)} /></Tooltip>
        </PMOnly>
      )}
      {onRemove && (
        <PMOnly ok={isProjectManager}>
          <Popconfirm title="Remove this milestone?" onConfirm={() => onRemove(milestone.milestoneId)}>
            <Tooltip title="Remove"><Button size="small" type="link" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </PMOnly>
      )}
    </div>
  </div>
);

export default MilestoneRow;
