import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useManagerWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const managerId = cookies.employeeId ?? cookies.userId ?? '';

  const loadManagerData = useCallback(async () => {
    if (!organizationId || !managerId) return;

    store.setLoadingTeamOverview(true);
    store.setLoadingApprovals(true);
    try {
      const res = await HrmDashboardService.getManagerDashboard({ organizationId, managerId });
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
  }, [organizationId, managerId]);

  return { loadManagerData };
}
