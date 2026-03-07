'use client';

import { useEffect } from 'react';
import HrKpiRow from '../organisms/hr/HrKpiRow';
import HeadcountTrendWidget from '../organisms/hr/HeadcountTrendWidget';
import DepartmentDistributionWidget from '../organisms/hr/DepartmentDistributionWidget';
import AttritionGaugeWidget from '../organisms/hr/AttritionGaugeWidget';
import LeaveUtilizationWidget from '../organisms/hr/LeaveUtilizationWidget';
import HrAlertsWidget from '../organisms/hr/HrAlertsWidget';
import { useHrWidgets } from '../../hooks/useHrWidgets';
import styles from '../../styles/Dashboard.module.css';

export default function HrDashboardTemplate() {
  const { loadHrData } = useHrWidgets();

  useEffect(() => {
    loadHrData();
  }, [loadHrData]);

  return (
    <div className={styles.dashboardContent}>
      <div style={{ marginBottom: 16 }}>
        <HrKpiRow />
      </div>
      <div style={{ marginBottom: 16 }}>
        <HeadcountTrendWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <DepartmentDistributionWidget />
        <AttritionGaugeWidget />
        <LeaveUtilizationWidget />
      </div>
      <div>
        <HrAlertsWidget />
      </div>
    </div>
  );
}
