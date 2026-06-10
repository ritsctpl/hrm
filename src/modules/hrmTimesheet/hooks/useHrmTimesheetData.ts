'use client';
// src/modules/hrmTimesheet/hooks/useHrmTimesheetData.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmTimesheetStore } from '../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../services/hrmTimesheetService';
import { HrmProjectService } from '../../hrmProject/services/hrmProjectService';
import { useEmployeeIdentity } from '../../hrmAccess/hooks/useEmployeeIdentity';
import type { TimesheetHeader, TimesheetLine } from '../types/domain.types';

/** Last day of the month as local YYYY-MM-DD (avoids the toISOString UTC shift
 *  that dropped the final day of the month in positive-offset timezones). */
function monthEndLocal(monthStart: string): string {
  const [y, m] = monthStart.split('-').map(Number);
  const last = new Date(y, m, 0).getDate(); // day 0 of next month = last day of this month
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
}

export function mapTimesheetResponse(r: import('../types/api.types').TimesheetResponse): TimesheetHeader {
  return {
    handle: r.handle,
    site: r.site,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    department: r.department,
    buCode: r.buCode,
    supervisorId: r.supervisorId,
    date: r.date,
    lines: r.lines.map((l): TimesheetLine => ({
      lineId: l.lineId,
      lineType: l.lineType as TimesheetLine['lineType'],
      projectHandle: l.projectHandle,
      projectCode: l.projectCode,
      projectName: l.projectName,
      allocationHandle: l.allocationHandle,
      taskId: l.taskId,
      taskName: l.taskName,
      hours: l.hours,
      categoryId: l.categoryId,
      categoryLabel: l.categoryLabel,
      reason: l.reason,
      notes: l.notes,
      allocatedHoursForDay: l.allocatedHoursForDay,
      // overrun is now computed server-side (TS-BE-5): hours > allocatedHoursForDay
      // && allocatedHoursForDay > 0. Trust the wire value.
      overrun: Boolean(l.overrun),
    })),
    totalHours: r.totalHours,
    colorCode: r.colorCode as TimesheetHeader['colorCode'],
    status: r.status as TimesheetHeader['status'],
    notes: r.notes,
    version: r.version,
    holiday: r.holiday,
    leaveDay: r.leaveDay,
    leaveType: r.leaveType,
    active: r.active,
    createdDateTime: r.createdDateTime,
    modifiedDateTime: r.modifiedDateTime,
  };
}

export function useHrmTimesheetData() {
  const store = useHrmTimesheetStore();
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  const employeeId = identity.employeeCode;
  // Identity contract (per backend audit 2026-06-09): the timesheet service
  // normalises identifiers via EmployeeIdentityUtils.parseCode(), so the bare
  // employeeCode is correct for own-record AND supervisor-context lookups.
  // (Approvals returning empty is a separate backend bug — supervisorId is not
  // persisted on /save — not an identity-format problem.)
  const supervisorId = employeeId;
  // Gate every backend call on identity.isReady — until the directory lookup
  // resolves, employeeCode may be a login-email fallback that the backend
  // rejects (400 Bad Request) or silently returns nothing for. isReady is in
  // each useCallback's deps so callers' useEffects re-fire once it resolves.
  const isReady = identity.isReady;

  const loadMonthlyTimesheets = useCallback(async () => {
    if (!isReady) return;
    store.setLoadingMonth(true);
    try {
      const monthStart = store.selectedMonth; // YYYY-MM-01
      const data = await HrmTimesheetService.listTimesheets(
        organizationId,
        employeeId,
        monthStart,
        monthEndLocal(monthStart)
      );
      store.setMonthlyTimesheets(data.map(mapTimesheetResponse));
    } catch (err) {
      console.error('Failed to load monthly timesheets:', err);
    } finally {
      store.setLoadingMonth(false);
    }
  }, [organizationId, employeeId, isReady, store.selectedMonth]);

  const loadWeeklyTimesheets = useCallback(async () => {
    if (!isReady) return;
    store.setLoadingWeek(true);
    try {
      const data = await HrmTimesheetService.getWeeklyTimesheet(organizationId, employeeId, store.selectedWeekStart);
      store.setWeeklyTimesheets(data.dailyTimesheets.map(mapTimesheetResponse));
      store.setWeekSummary({
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        weekStartDate: data.weekStartDate,
        weekEndDate: data.weekEndDate,
        dailyTimesheets: data.dailyTimesheets.map(mapTimesheetResponse),
        weeklyTotalHours: data.weeklyTotalHours,
        greenDays: data.greenDays,
        yellowDays: data.yellowDays,
        redDays: data.redDays,
        submittedDays: data.submittedDays,
        pendingDays: data.pendingDays,
      });
    } catch (err) {
      console.error('Failed to load weekly timesheets:', err);
    } finally {
      store.setLoadingWeek(false);
    }
  }, [organizationId, employeeId, isReady, store.selectedWeekStart]);

  const loadDayTimesheet = useCallback(async (date: string) => {
    if (!isReady) return;
    store.setLoadingDay(true);
    try {
      const data = await HrmTimesheetService.getTimesheetByDate(organizationId, employeeId, date);
      store.setCurrentDayTimesheet(mapTimesheetResponse(data));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (!status || status === 404) {
        store.setCurrentDayTimesheet(null);
      } else {
        message.error('Failed to load timesheet for this day');
      }
    } finally {
      store.setLoadingDay(false);
    }
  }, [organizationId, employeeId, isReady]);

  const loadPendingApprovals = useCallback(async () => {
    if (!isReady) return;
    store.setLoadingApprovals(true);
    try {
      const data = await HrmTimesheetService.getPendingApprovals(organizationId, supervisorId);
      store.setPendingApprovals(data.map(mapTimesheetResponse));
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      store.setLoadingApprovals(false);
    }
  }, [organizationId, supervisorId, isReady]);

  const loadTeamTimesheets = useCallback(async () => {
    if (!isReady) return;
    store.setLoadingTeam(true);
    try {
      const endDate = new Date(store.selectedWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      const data = await HrmTimesheetService.getTeamTimesheets(
        organizationId,
        supervisorId,
        store.selectedWeekStart,
        endDate.toISOString().slice(0, 10)
      );
      // Backend audit (C3): the team endpoint returns FLAT day-rows
      // ({employeeId, date, totalHours, colorCode, status, ...}), not the
      // nested {weeklyData[]} shape the frontend type implies. Group flat rows
      // by employee here; stay tolerant of either shape so it keeps working if
      // the backend later switches to the nested contract.
      const grouped = new Map<string, import('../types/domain.types').TeamTimesheetSummary>();
      for (const r of data as Array<Record<string, any>>) {
        const empId = r.employeeId;
        if (!grouped.has(empId)) {
          grouped.set(empId, {
            employeeId: empId,
            employeeName: r.employeeName,
            department: r.department,
            weeklyData: [],
          });
        }
        const bucket = grouped.get(empId)!;
        const days = Array.isArray(r.weeklyData)
          ? r.weeklyData
          : r.date
            ? [r]
            : [];
        days.forEach((d: Record<string, any>) => {
          bucket.weeklyData.push({
            date: d.date,
            totalHours: d.totalHours ?? 0,
            colorCode: (d.colorCode ?? 'GREY') as TimesheetHeader['colorCode'],
            status: d.status,
            timesheetHandle: d.timesheetHandle,
          });
        });
      }
      store.setTeamTimesheets(Array.from(grouped.values()));
    } catch (err) {
      console.error('Failed to load team timesheets:', err);
    } finally {
      store.setLoadingTeam(false);
    }
  }, [organizationId, supervisorId, isReady, store.selectedWeekStart]);

  const loadAssignedAllocations = useCallback(async () => {
    if (!isReady) return;
    store.setLoadingAllocations(true);
    try {
      // Projects + tasks are owned by hrm-project. Only the employee's APPROVED
      // allocations are "assigned" — these seed the weekly matrix rows so only
      // assigned work is loggable.
      const data = await HrmProjectService.getAllocationsByEmployee(organizationId, employeeId, 'APPROVED');
      store.setAssignedAllocations(
        data.map((a) => ({
          allocationHandle: a.handle,
          projectHandle: a.projectHandle,
          projectCode: a.projectCode,
          projectName: a.projectName,
          taskId: a.taskId ?? undefined,
          taskName: a.taskName ?? undefined,
          hoursPerDay: a.hoursPerDay,
          startDate: a.startDate,
          endDate: a.endDate,
        }))
      );
    } catch (err) {
      console.error('Failed to load assigned allocations:', err);
    } finally {
      store.setLoadingAllocations(false);
    }
  }, [organizationId, employeeId, isReady]);

  const loadTargetEmployeeMonth = useCallback(async () => {
    if (!isReady) return;
    const target = store.targetEmployee;
    if (!target) return;
    store.setLoadingTargetEmployee(true);
    try {
      const monthStart = store.selectedMonth;
      const data = await HrmTimesheetService.listTimesheets(
        organizationId,
        target.employeeId,
        monthStart,
        monthEndLocal(monthStart)
      );
      store.setTargetEmployeeTimesheets(data.map(mapTimesheetResponse));
    } catch (err) {
      console.error('Failed to load employee timesheets for review:', err);
    } finally {
      store.setLoadingTargetEmployee(false);
    }
  }, [organizationId, isReady, store.targetEmployee, store.selectedMonth]);

  const loadUnplannedCategories = useCallback(async () => {
    try {
      const data = await HrmTimesheetService.getUnplannedCategories(organizationId);
      store.setUnplannedCategories(data.map((c) => ({
        handle: c.handle,
        site: c.site,
        label: c.label,
        description: c.description,
        displayOrder: c.displayOrder,
        active: c.active,
      })));
    } catch (err) {
      console.error('Failed to load unplanned categories:', err);
    }
  }, [organizationId]);

  return {
    loadMonthlyTimesheets,
    loadWeeklyTimesheets,
    loadDayTimesheet,
    loadAssignedAllocations,
    loadTargetEmployeeMonth,
    loadPendingApprovals,
    loadTeamTimesheets,
    loadUnplannedCategories,
  };
}
