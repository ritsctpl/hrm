'use client';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import MilestoneRow from '../molecules/MilestoneRow';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import type { MilestoneStatus } from '../../types/domain.types';
import styles from '../../styles/ProjectDetail.module.css';

export default function ProjectMilestonesTab() {
  const { selectedProject } = useHrmProjectStore();
  const { updateMilestoneStatus } = useProjectMutations();

  if (!selectedProject) return null;

  const handleStatusChange = (milestoneId: string, status: MilestoneStatus) => {
    updateMilestoneStatus(
      selectedProject.handle,
      milestoneId,
      status,
      'current-user'
    );
  };

  return (
    <div className={styles.milestonesTab}>
      <div className={styles.tabHeader}>
        <Button type="primary" ghost icon={<PlusOutlined />} size="small">
          Add Milestone
        </Button>
      </div>
      <div className={styles.milestonesList}>
        <div className={styles.milestoneHeader}>
          <span>Milestone Name</span>
          <span>Target Date</span>
          <span>Status</span>
          <span>Description</span>
        </div>
        {selectedProject.milestones.map((m) => (
          <MilestoneRow
            key={m.milestoneId}
            milestone={m}
            isEditing={false}
            onStatusChange={handleStatusChange}
          />
        ))}
        {selectedProject.milestones.length === 0 && (
          <div className={styles.emptyList}>No milestones defined</div>
        )}
      </div>
    </div>
  );
}
