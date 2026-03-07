'use client';

import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import TeamMemberStatusRow from '../../molecules/TeamMemberStatusRow';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function TeamOverviewWidget() {
  const { teamOverviewStats, teamMembers, loadingTeamOverview } = useHrmDashboardStore();

  return (
    <WidgetCard title="Team Overview" loading={loadingTeamOverview}>
      {teamOverviewStats && (
        <div className={styles.teamStatsRow}>
          <div className={styles.teamStatBox}>
            <div className={styles.teamStatNum} style={{ color: '#52c41a' }}>
              {teamOverviewStats.present}
            </div>
            <div className={styles.teamStatLabel}>Present</div>
          </div>
          <div className={styles.teamStatBox}>
            <div className={styles.teamStatNum} style={{ color: '#faad14' }}>
              {teamOverviewStats.onLeave}
            </div>
            <div className={styles.teamStatLabel}>On Leave</div>
          </div>
          <div className={styles.teamStatBox}>
            <div className={styles.teamStatNum} style={{ color: '#1890ff' }}>
              {teamOverviewStats.remote}
            </div>
            <div className={styles.teamStatLabel}>Remote</div>
          </div>
          <div className={styles.teamStatBox}>
            <div className={styles.teamStatNum}>{teamOverviewStats.total}</div>
            <div className={styles.teamStatLabel}>Total</div>
          </div>
        </div>
      )}
      {teamMembers.length === 0 ? (
        <div className={styles.emptyState}>No team members</div>
      ) : (
        teamMembers.slice(0, 8).map((m) => (
          <TeamMemberStatusRow key={m.id} member={m} />
        ))
      )}
    </WidgetCard>
  );
}
