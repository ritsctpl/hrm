'use client';

import { useEffect } from 'react';
import { Drawer, Switch } from 'antd';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmDashboardStore } from './stores/hrmDashboardStore';
import { getDashboardRole, WIDGET_LABELS } from './utils/dashboardConstants';
import HrmDashboardScreen from './HrmDashboardScreen';
import styles from './styles/Dashboard.module.css';

export default function HrmDashboardLanding() {
  const {
    dashboardRole,
    activeWidgets,
    showCustomizeDrawer,
    setDashboardRole,
    setActiveWidgets,
    setShowCustomizeDrawer,
  } = useHrmDashboardStore();

  const cookies = parseCookies();

  useEffect(() => {
    const rawRole = cookies.userRole ?? 'EMPLOYEE';
    setDashboardRole(getDashboardRole(rawRole));
  }, []);

  function handleWidgetToggle(widgetKey: string, checked: boolean) {
    if (checked) {
      setActiveWidgets([...activeWidgets, widgetKey]);
    } else {
      setActiveWidgets(activeWidgets.filter((w) => w !== widgetKey));
    }
  }

  return (
    <div className={styles.dashboardRoot}>
      <CommonAppBar appTitle="HRM Dashboard" />

      <HrmDashboardScreen />

      <Drawer
        title="Customize Dashboard"
        open={showCustomizeDrawer}
        onClose={() => setShowCustomizeDrawer(false)}
        width={320}
      >
        {Object.entries(WIDGET_LABELS).map(([key, label]) => (
          <div key={key} className={styles.customizeWidget}>
            <span className={styles.customizeLabel}>{label}</span>
            <Switch
              size="small"
              checked={activeWidgets.length === 0 || activeWidgets.includes(key)}
              onChange={(checked) => handleWidgetToggle(key, checked)}
            />
          </div>
        ))}
      </Drawer>
    </div>
  );
}
