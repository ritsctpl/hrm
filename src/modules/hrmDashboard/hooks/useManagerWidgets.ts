import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useManagerWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const managerId = cookies.employeeId ?? cookies.userId ?? '';

  const loadManagerData = useCallback(async () => {
    if (!site || !managerId) return;

    store.setLoadingTeamOverview(true);
    store.setLoadingApprovals(true);
    try {
      const res = await HrmDashboardService.getManagerDashboard({ site, managerId });
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
      // silently handle
    } finally {
      store.setLoadingTeamOverview(false);
      store.setLoadingApprovals(false);
    }
  }, [site, managerId]);

  return { loadManagerData };
}
