'use client';

import React from 'react';
import { Button, Space, Typography, Popconfirm } from 'antd';
import RbacStatusBadge from '../atoms/RbacStatusBadge';
import type { RbacAssignmentHistoryItemProps } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

const { Text } = Typography;

const RbacAssignmentHistoryItem: React.FC<RbacAssignmentHistoryItemProps> = ({
  assignment,
  onRevoke,
  isRevoking,
}) => {
  const isActive = assignment.assignmentStatus === 'ACTIVE';

  return (
    <div className={styles.historyItem}>
      <div className={styles.historyHeader}>
        <Text strong>{assignment.roleName}</Text>
        <RbacStatusBadge
          isActive={isActive}
          assignmentStatus={assignment.assignmentStatus}
        />
      </div>
      <div className={styles.historyDates}>
        <Text type="secondary">
          From: {assignment.effectiveFrom}
        </Text>
        {assignment.effectiveTo && (
          <Text type="secondary"> &nbsp;To: {assignment.effectiveTo}</Text>
        )}
        {!assignment.effectiveTo && isActive && (
          <Text type="secondary"> &nbsp;(no end date)</Text>
        )}
      </div>
      {assignment.assignmentNotes && (
        <Text type="secondary" className={styles.historyNotes}>
          {assignment.assignmentNotes}
        </Text>
      )}
      {isActive && (
        <Space className={styles.historyActions}>
          <Popconfirm
            title={`Revoke "${assignment.roleName}"?`}
            description="This action cannot be undone."
            onConfirm={() => onRevoke(assignment.handle)}
            okText="Revoke"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              size="small"
              loading={isRevoking}
              disabled={isRevoking}
            >
              Revoke
            </Button>
          </Popconfirm>
        </Space>
      )}
    </div>
  );
};

export default RbacAssignmentHistoryItem;
