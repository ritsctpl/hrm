import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useAdminWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const userId = cookies.userId ?? '';

  const loadAdminData = useCallback(async () => {
    if (!site) return;

    store.setLoadingAdminData(true);
    try {
      const res = await HrmDashboardService.getAdminDashboard({ site, requestedBy: userId });
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
      store.setLoadingAdminData(false);
    }
  }, [site, userId]);

  return { loadAdminData };
}
