'use client';

import ReactECharts from 'echarts-for-react';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import { buildModuleUsageOption } from '../../../utils/dashboardChartOptions';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function ModuleUsageWidget() {
  const { moduleUsage, loadingAdminData } = useHrmDashboardStore();

  return (
    <WidgetCard title="Module Usage" loading={loadingAdminData}>
      {moduleUsage.length === 0 ? (
        <div className={styles.emptyState}>No usage data</div>
      ) : (
        <ReactECharts
          option={buildModuleUsageOption(moduleUsage)}
          style={{ height: moduleUsage.length * 32 + 40 }}
          notMerge
        />
      )}
    </WidgetCard>
  );
}
