'use client';

import React from 'react';
import { Skeleton, Typography, Divider } from 'antd';
import RbacAssignmentHistoryItem from '../molecules/RbacAssignmentHistoryItem';
import type { UserRoleHistoryPanelProps } from '../../types/ui.types';
import styles from '../../styles/UserRoleAssignment.module.css';

const { Text } = Typography;

const UserRoleHistoryPanel: React.FC<UserRoleHistoryPanelProps> = ({
  assignments,
  isLoading,
  isRevoking,
  onRevoke,
}) => {
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const active = assignments.filter((a) => a.assignmentStatus === 'ACTIVE');
  const historical = assignments.filter((a) => a.assignmentStatus !== 'ACTIVE');

  return (
    <div className={styles.historyPanel}>
      <Text strong>Active Assignments ({active.length})</Text>
      {active.length === 0 ? (
        <Text type="secondary" className={styles.noAssignments}>
          No active assignments.
        </Text>
      ) : (
        <div className={styles.historyList}>
          {active.map((assignment) => (
            <RbacAssignmentHistoryItem
              key={assignment.handle}
              assignment={assignment}
              onRevoke={onRevoke}
              isRevoking={isRevoking}
            />
          ))}
        </div>
      )}

      {historical.length > 0 && (
        <>
          <Divider />
          <Text strong>Assignment History ({historical.length})</Text>
          <div className={styles.historyList}>
            {historical.map((assignment) => (
              <RbacAssignmentHistoryItem
                key={assignment.handle}
                assignment={assignment}
                onRevoke={onRevoke}
                isRevoking={isRevoking}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserRoleHistoryPanel;
