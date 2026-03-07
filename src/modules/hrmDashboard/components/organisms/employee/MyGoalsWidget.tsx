'use client';

import { Progress } from 'antd';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import GoalMiniBar from '../../molecules/GoalMiniBar';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function MyGoalsWidget() {
  const { myGoals, goalsOverall, loadingGoals } = useHrmDashboardStore();

  return (
    <WidgetCard title="My Goals" loading={loadingGoals}>
      {myGoals.length === 0 ? (
        <div className={styles.emptyState}>No goals assigned</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Progress
              type="circle"
              percent={goalsOverall}
              size={56}
              format={(pct) => `${pct}%`}
              strokeColor="#1890ff"
            />
            <span style={{ fontSize: 13, color: '#595959' }}>Overall Progress</span>
          </div>
          {myGoals.map((g) => (
            <GoalMiniBar key={g.id} goal={g} />
          ))}
        </>
      )}
    </WidgetCard>
  );
}
