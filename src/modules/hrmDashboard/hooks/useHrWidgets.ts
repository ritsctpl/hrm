import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { HrmDashboardService } from '../services/hrmDashboardService';
import { useHrmDashboardStore } from '../stores/hrmDashboardStore';

export function useHrWidgets() {
  const store = useHrmDashboardStore();
  const cookies = parseCookies();
  const site = cookies.site ?? '';

  const loadHrData = useCallback(async () => {
    if (!site) return;

    store.setLoadingHrData(true);
    try {
      const res = await HrmDashboardService.getHrDashboard({ site });
      if (res?.hrKpis) store.setHrKpis(res.hrKpis);
      if (res?.headcountTrend) store.setHeadcountTrend(res.headcountTrend);
      if (res?.deptDistribution) store.setDeptDistribution(res.deptDistribution);
      if (res?.attritionData) store.setAttritionData(res.attritionData);
      if (res?.leaveUtilization) store.setLeaveUtilization(res.leaveUtilization);
      if (res?.hrAlerts) store.setHrAlerts(res.hrAlerts);
    } catch {
      // silently handle
    } finally {
      store.setLoadingHrData(false);
    }
  }, [site]);

  return { loadHrData };
}
