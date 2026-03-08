import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useEmployeeWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const employeeId = cookies.employeeId ?? cookies.userId ?? '';

  const loadEmployeeData = useCallback(async () => {
    if (!site || !employeeId) return;

    store.setLoadingProfile(true);
    try {
      const res = await HrmDashboardService.getEmployeeDashboard({ site, employeeId });
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
  }, [site, employeeId]);

  return { loadEmployeeData };
}
