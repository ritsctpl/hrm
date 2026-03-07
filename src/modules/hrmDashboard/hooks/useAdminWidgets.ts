import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useAdminWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const site = cookies.site ?? '';

  const loadAdminData = useCallback(async () => {
    if (!site) return;

    store.setLoadingAdminData(true);
    try {
      const res = await HrmDashboardService.getAdminDashboard({ site });
      if (res?.systemHealth) store.setSystemHealth(res.systemHealth);
      if (res?.moduleUsage) store.setModuleUsage(res.moduleUsage);
      if (res?.auditActivity) store.setAuditActivity(res.auditActivity);
      if (res?.adminAlerts) store.setAdminAlerts(res.adminAlerts);
    } catch {
      // silently handle
    } finally {
      store.setLoadingAdminData(false);
    }
  }, [site]);

  return { loadAdminData };
}
