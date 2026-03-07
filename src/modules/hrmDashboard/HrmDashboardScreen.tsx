'use client';

import { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { Spin } from 'antd';
import { useHrmDashboardStore } from './stores/hrmDashboardStore';
import type { DashboardRole } from './types/domain.types';

const EmployeeDashboardTemplate = lazy(() =>
  import('./components/templates/EmployeeDashboardTemplate')
);
const ManagerDashboardTemplate = lazy(() =>
  import('./components/templates/ManagerDashboardTemplate')
);
const HrDashboardTemplate = lazy(() =>
  import('./components/templates/HrDashboardTemplate')
);
const AdminDashboardTemplate = lazy(() =>
  import('./components/templates/AdminDashboardTemplate')
);

const TEMPLATE_MAP: Record<DashboardRole, ComponentType> = {
  EMPLOYEE: EmployeeDashboardTemplate,
  MANAGER: ManagerDashboardTemplate,
  HR: HrDashboardTemplate,
  HR_MANAGER: HrDashboardTemplate,
  ADMIN: AdminDashboardTemplate,
  SUPERADMIN: AdminDashboardTemplate,
};

export default function HrmDashboardScreen() {
  const { dashboardRole } = useHrmDashboardStore();
  const DashTemplate = TEMPLATE_MAP[dashboardRole] ?? EmployeeDashboardTemplate;

  return (
    <Suspense fallback={<Spin style={{ display: 'block', margin: '80px auto' }} />}>
      <DashTemplate />
    </Suspense>
  );
}
