'use client';

import { useEffect } from 'react';
import { Drawer, Switch } from 'antd';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import WelcomeBanner from './components/molecules/WelcomeBanner';
import EmployeeDashboardTemplate from './components/templates/EmployeeDashboardTemplate';
import ManagerDashboardTemplate from './components/templates/ManagerDashboardTemplate';
import HrDashboardTemplate from './components/templates/HrDashboardTemplate';
import AdminDashboardTemplate from './components/templates/AdminDashboardTemplate';
import { useHrmDashboardStore } from './stores/hrmDashboardStore';
import { useEmployeeWidgets } from './hooks/useEmployeeWidgets';
import { useManagerWidgets } from './hooks/useManagerWidgets';
import { useHrWidgets } from './hooks/useHrWidgets';
import { useAdminWidgets } from './hooks/useAdminWidgets';
import { getDashboardRole, WIDGET_LABELS } from './utils/dashboardConstants';
import type { DashboardRole } from './types/domain.types';
import styles from './styles/Dashboard.module.css';

const APP_BAR_TITLES: Record<string, string> = {
  EMPLOYEE: 'FENTA HRM',
  MANAGER: 'FENTA HRM -- Manager View',
  HR: 'FENTA HRM -- HR Analytics',
  HR_MANAGER: 'FENTA HRM -- HR Analytics',
  ADMIN: 'FENTA HRM -- Admin Dashboard',
  SUPERADMIN: 'FENTA HRM -- Admin Dashboard',
};

export default function HrmDashboardLanding() {
  const {
    dashboardRole,
    activeWidgets,
    employeeProfile,
    showCustomizeDrawer,
    setDashboardRole,
    setActiveWidgets,
    setShowCustomizeDrawer,
  } = useHrmDashboardStore();

  const cookies = parseCookies();
  const { loadEmployeeData } = useEmployeeWidgets();
  const { loadManagerData } = useManagerWidgets();
  const { loadHrData } = useHrWidgets();
  const { loadAdminData } = useAdminWidgets();

  useEffect(() => {
    const rawRole = cookies.userRole ?? 'EMPLOYEE';
    const role = getDashboardRole(rawRole);
    setDashboardRole(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data based on the resolved dashboard role
  useEffect(() => {
    switch (dashboardRole) {
      case 'EMPLOYEE':
        loadEmployeeData();
        break;
      case 'MANAGER':
        loadManagerData();
        loadEmployeeData(); // Manager also needs profile data
        break;
      case 'HR':
      case 'HR_MANAGER':
        loadHrData();
        loadEmployeeData(); // For welcome banner
        break;
      case 'ADMIN':
      case 'SUPERADMIN':
        loadAdminData();
        loadEmployeeData(); // For welcome banner
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardRole]);

  function handleWidgetToggle(widgetKey: string, checked: boolean) {
    if (checked) {
      setActiveWidgets([...activeWidgets, widgetKey]);
    } else {
      setActiveWidgets(activeWidgets.filter((w) => w !== widgetKey));
    }
  }

  const renderDashboard = () => {
    switch (dashboardRole) {
      case 'MANAGER':
        return <ManagerDashboardTemplate />;
      case 'HR':
      case 'HR_MANAGER':
        return <HrDashboardTemplate />;
      case 'ADMIN':
      case 'SUPERADMIN':
        return <AdminDashboardTemplate />;
      case 'EMPLOYEE':
      default:
        return <EmployeeDashboardTemplate />;
    }
  };

  return (
    <div className={styles.dashboardRoot}>
      <CommonAppBar appTitle={APP_BAR_TITLES[dashboardRole] ?? 'FENTA HRM'} />

      <div className={styles.dashboardContent}>
        {employeeProfile && (
          <WelcomeBanner
            profile={employeeProfile}
            onCustomize={() => setShowCustomizeDrawer(true)}
          />
        )}

        <div className={styles.widgetGrid}>
          {renderDashboard()}
        </div>
      </div>

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
