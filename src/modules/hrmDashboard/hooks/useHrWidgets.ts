import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useHrWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const userId = cookies.userId ?? '';

  const loadHrData = useCallback(async () => {
    if (!organizationId) return;

    store.setLoadingHrData(true);
    try {
      const res = await HrmDashboardService.getHrDashboard({ organizationId, requestedBy: userId });
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
      store.setLoadingHrData(false);
    }
  }, [organizationId, userId]);

  return { loadHrData };
}
