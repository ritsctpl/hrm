'use client';

import ReactECharts from 'echarts-for-react';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import { buildHeadcountTrendOption } from '../../../utils/dashboardChartOptions';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

export default function HeadcountTrendWidget() {
  const { headcountTrend, loadingHrData } = useHrmDashboardStore();

  return (
    <WidgetCard title="Headcount Trend (12 months)" loading={loadingHrData}>
      {headcountTrend.length === 0 ? (
        <div className={styles.emptyState}>No trend data</div>
      ) : (
        <ReactECharts
          option={buildHeadcountTrendOption(headcountTrend)}
          style={{ height: 260 }}
          notMerge
        />
      )}
    </WidgetCard>
  );
}
