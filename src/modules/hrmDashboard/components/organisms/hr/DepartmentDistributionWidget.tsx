'use client';

import ReactECharts from 'echarts-for-react';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import { buildDeptDistributionOption } from '../../../utils/dashboardChartOptions';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function DepartmentDistributionWidget() {
  const { deptDistribution, loadingHrData } = useHrmDashboardStore();

  return (
    <WidgetCard title="Department Distribution" loading={loadingHrData}>
      {deptDistribution.length === 0 ? (
        <div className={styles.emptyState}>No distribution data</div>
      ) : (
        <ReactECharts
          option={buildDeptDistributionOption(deptDistribution)}
          style={{ height: 240 }}
          notMerge
        />
      )}
    </WidgetCard>
  );
}
