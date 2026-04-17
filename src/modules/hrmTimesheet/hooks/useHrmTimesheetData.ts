'use client';
// src/modules/hrmTimesheet/hooks/useHrmTimesheetData.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmTimesheetStore } from '../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../services/hrmTimesheetService';
import { resolveEmployeeId } from '../utils/resolveEmployeeId';
import type { TimesheetHeader, TimesheetLine } from '../types/domain.types';

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
      hours: l.hours,
      categoryId: l.categoryId,
      categoryLabel: l.categoryLabel,
      reason: l.reason,
      notes: l.notes,
      allocatedHoursForDay: l.allocatedHoursForDay,
      overrun: l.overrun,
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
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId = resolveEmployeeId(cookies);

  const loadWeeklyTimesheets = useCallback(async () => {
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
  }, [organizationId, employeeId, store.selectedWeekStart]);

  const loadDayTimesheet = useCallback(async (date: string) => {
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
  }, [organizationId, employeeId]);

  const loadPendingApprovals = useCallback(async () => {
    store.setLoadingApprovals(true);
    try {
      const data = await HrmTimesheetService.getPendingApprovals(organizationId, employeeId);
      store.setPendingApprovals(data.map(mapTimesheetResponse));
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      store.setLoadingApprovals(false);
    }
  }, [organizationId, employeeId]);

  const loadTeamTimesheets = useCallback(async () => {
    store.setLoadingTeam(true);
    try {
      const endDate = new Date(store.selectedWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      const data = await HrmTimesheetService.getTeamTimesheets(
        organizationId,
        employeeId,
        store.selectedWeekStart,
        endDate.toISOString().slice(0, 10)
      );
      store.setTeamTimesheets(data.map((r) => ({
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: r.department,
        weeklyData: r.weeklyData.map((d) => ({
          date: d.date,
          totalHours: d.totalHours,
          colorCode: d.colorCode as TimesheetHeader['colorCode'],
          status: d.status,
          timesheetHandle: d.timesheetHandle,
        })),
      })));
    } catch (err) {
      console.error('Failed to load team timesheets:', err);
    } finally {
      store.setLoadingTeam(false);
    }
  }, [organizationId, employeeId, store.selectedWeekStart]);

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
    loadWeeklyTimesheets,
    loadDayTimesheet,
    loadPendingApprovals,
    loadTeamTimesheets,
    loadUnplannedCategories,
  };
}
