'use client';

import ReactECharts from 'echarts-for-react';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import { buildLeaveUtilizationOption } from '../../../utils/dashboardChartOptions';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function LeaveUtilizationWidget() {
  const { leaveUtilization, loadingHrData } = useHrmDashboardStore();

  return (
    <WidgetCard title="Leave Utilization" loading={loadingHrData}>
      {leaveUtilization.length === 0 ? (
        <div className={styles.emptyState}>No utilization data</div>
      ) : (
        <ReactECharts
          option={buildLeaveUtilizationOption(leaveUtilization)}
          style={{ height: 220 }}
          notMerge
        />
      )}
    </WidgetCard>
  );
}
