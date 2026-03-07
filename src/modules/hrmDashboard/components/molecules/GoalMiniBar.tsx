'use client';

import { Tooltip } from 'antd';
import { GoalProgress } from '../../types/domain.types';
import styles from '../../styles/Dashboard.module.css';

interface GoalMiniBarProps {
  goal: GoalProgress;
}

function progressColor(progress: number) {
  if (progress >= 80) return '#52c41a';
  if (progress >= 50) return '#1890ff';
  return '#faad14';
}

export default function GoalMiniBar({ goal }: GoalMiniBarProps) {
  return (
    <div className={styles.goalMiniBar}>
      <div className={styles.goalBarHeader}>
        <span className={styles.goalTitle}>{goal.title}</span>
        <span className={styles.goalPct}>{goal.progress}%</span>
      </div>
      <Tooltip title={`${goal.progress}% complete`}>
        <div className={styles.goalBarTrack}>
          <div
            className={styles.goalBarFill}
            style={{ width: `${goal.progress}%`, background: progressColor(goal.progress) }}
          />
        </div>
      </Tooltip>
    </div>
  );
}
