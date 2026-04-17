import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useEmployeeWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId = cookies.employeeId ?? cookies.userId ?? '';

  const loadEmployeeData = useCallback(async () => {
    if (!organizationId || !employeeId) return;

    store.setLoadingProfile(true);
    try {
      const res = await HrmDashboardService.getEmployeeDashboard({ organizationId, employeeId });
      // The backend returns { widgets: DashboardWidget[], layout, alerts, ... }
      // Store the full response; components should read from widgets array
      if (res?.widgets) {
        store.setDashboardWidgets(res.widgets);
      }
      if (res?.layout) {
        store.setDashboardLayout(res.layout);
      }
      if (res?.alerts) {
        store.setDashboardAlerts(res.alerts);
      }
    } catch {
      // silently handle — widget shows empty state
    } finally {
      store.setLoadingProfile(false);
    }
  }, [organizationId, employeeId]);

  return { loadEmployeeData };
}
