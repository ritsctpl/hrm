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
      if (res?.employeeProfile) store.setEmployeeProfile(res.employeeProfile);
      if (res?.leaveBalances) store.setLeaveBalances(res.leaveBalances);
      if (res?.pendingRequests) store.setPendingRequests(res.pendingRequests);
      if (res?.recentPayslips) store.setRecentPayslips(res.recentPayslips);
      if (res?.myGoals) store.setMyGoals(res.myGoals, res.goalsOverall ?? 0);
      if (res?.upcomingHolidays) store.setUpcomingHolidays(res.upcomingHolidays);
      if (res?.announcementAlerts) store.setAnnouncementAlerts(res.announcementAlerts);
    } catch {
      // silently handle — widget shows empty state
    } finally {
      store.setLoadingProfile(false);
    }
  }, [site, employeeId]);

  return { loadEmployeeData };
}
