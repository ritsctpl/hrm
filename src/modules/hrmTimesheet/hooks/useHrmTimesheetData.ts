'use client';
// src/modules/hrmTimesheet/hooks/useHrmTimesheetData.ts
import { useCallback } from 'react';
import { parseCookies } from 'nookies';
import { useHrmTimesheetStore } from '../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../services/hrmTimesheetService';
import type { TimesheetHeader, TimesheetLine } from '../types/domain.types';

function mapTimesheetResponse(r: import('../types/api.types').TimesheetResponse): TimesheetHeader {
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
      isOverrun: l.isOverrun,
    })),
    totalHours: r.totalHours,
    colorCode: r.colorCode as TimesheetHeader['colorCode'],
    status: r.status as TimesheetHeader['status'],
    notes: r.notes,
    version: r.version,
    isHoliday: r.isHoliday,
    isLeaveDay: r.isLeaveDay,
    leaveType: r.leaveType,
    active: r.active,
    createdDateTime: r.createdDateTime,
    modifiedDateTime: r.modifiedDateTime,
  };
}

export function useHrmTimesheetData() {
  const store = useHrmTimesheetStore();
  const { site } = parseCookies();
  const employeeId = parseCookies().employeeId ?? '';

  const loadWeeklyTimesheets = useCallback(async () => {
    store.setLoadingWeek(true);
    try {
      const data = await HrmTimesheetService.getWeeklyTimesheet(site, employeeId, store.selectedWeekStart);
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
  }, [site, employeeId, store.selectedWeekStart]);

  const loadDayTimesheet = useCallback(async (date: string) => {
    store.setLoadingDay(true);
    try {
      const data = await HrmTimesheetService.getTimesheetByDate(site, employeeId, date);
      store.setCurrentDayTimesheet(mapTimesheetResponse(data));
    } catch (err) {
      // No timesheet for this day — create empty
      store.setCurrentDayTimesheet(null);
    } finally {
      store.setLoadingDay(false);
    }
  }, [site, employeeId]);

  const loadPendingApprovals = useCallback(async () => {
    store.setLoadingApprovals(true);
    try {
      const data = await HrmTimesheetService.getPendingApprovals(site, employeeId);
      store.setPendingApprovals(data.map(mapTimesheetResponse));
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      store.setLoadingApprovals(false);
    }
  }, [site, employeeId]);

  const loadTeamTimesheets = useCallback(async () => {
    store.setLoadingTeam(true);
    try {
      const endDate = new Date(store.selectedWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      const data = await HrmTimesheetService.getTeamTimesheets(
        site,
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
  }, [site, employeeId, store.selectedWeekStart]);

  const loadUnplannedCategories = useCallback(async () => {
    try {
      const data = await HrmTimesheetService.getUnplannedCategories(site);
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
  }, [site]);

  return {
    loadWeeklyTimesheets,
    loadDayTimesheet,
    loadPendingApprovals,
    loadTeamTimesheets,
    loadUnplannedCategories,
  };
}
