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
      if (res?.teamOverviewStats) store.setTeamOverviewStats(res.teamOverviewStats);
      if (res?.teamMembers) store.setTeamMembers(res.teamMembers);
      if (res?.pendingApprovals) store.setPendingApprovals(res.pendingApprovals);
    } catch {
      // silently handle
    } finally {
      store.setLoadingTeamOverview(false);
      store.setLoadingApprovals(false);
    }
  }, [site, managerId]);

  return { loadManagerData };
}
