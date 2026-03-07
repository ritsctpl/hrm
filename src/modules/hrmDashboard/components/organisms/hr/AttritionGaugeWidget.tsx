'use client';

import ReactECharts from 'echarts-for-react';
import { useHrmDashboardStore } from '../../../stores/hrmDashboardStore';
import { buildAttritionGaugeOption } from '../../../utils/dashboardChartOptions';
import WidgetCard from '../WidgetCard';
import styles from '../../../styles/Dashboard.module.css';

const STATUS_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  warning: 'Needs Attention',
  critical: 'Critical',
};

const STATUS_COLOR: Record<string, string> = {
  healthy: '#52c41a',
  warning: '#faad14',
  critical: '#ff4d4f',
};

export default function AttritionGaugeWidget() {
  const { attritionData, loadingHrData } = useHrmDashboardStore();

  return (
    <WidgetCard title="Attrition Rate" loading={loadingHrData}>
      {!attritionData ? (
        <div className={styles.emptyState}>No attrition data</div>
      ) : (
        <>
          <ReactECharts
            option={buildAttritionGaugeOption(attritionData)}
            style={{ height: 180 }}
            notMerge
          />
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span
              style={{
                fontSize: 12,
                color: STATUS_COLOR[attritionData.status] ?? '#666',
                fontWeight: 500,
              }}
            >
              {STATUS_LABEL[attritionData.status] ?? attritionData.status}
            </span>
            <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 8 }}>
              Target: {attritionData.targetRate}%
            </span>
          </div>
        </>
      )}
    </WidgetCard>
  );
}
