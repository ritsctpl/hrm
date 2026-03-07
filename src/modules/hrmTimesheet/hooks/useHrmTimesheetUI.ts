'use client';
// src/modules/hrmTimesheet/hooks/useHrmTimesheetUI.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { useHrmTimesheetStore } from '../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../services/hrmTimesheetService';
import { useHrmTimesheetData } from './useHrmTimesheetData';
import type { TimesheetLine } from '../types/domain.types';

export function useHrmTimesheetUI() {
  const store = useHrmTimesheetStore();
  const { loadWeeklyTimesheets, loadDayTimesheet, loadPendingApprovals } = useHrmTimesheetData();
  const { site } = parseCookies();
  const employeeId = parseCookies().employeeId ?? '';

  const saveTimesheet = useCallback(async (notes?: string) => {
    if (!store.currentDayTimesheet && (!store.currentDayTimesheet || (store.currentDayTimesheet as unknown as { lines: TimesheetLine[] }).lines?.length === 0)) {
      message.warning('No timesheet lines to save');
      return;
    }
    store.setSavingTimesheet(true);
    try {
      const lines = store.currentDayTimesheet?.lines ?? [];
      await HrmTimesheetService.saveTimesheet({
        site,
        employeeId,
        date: store.selectedDate,
        lines: lines.map((l) => ({
          lineType: l.lineType,
          projectHandle: l.projectHandle,
          allocationHandle: l.allocationHandle,
          hours: l.hours,
          categoryId: l.categoryId,
          reason: l.reason,
          notes: l.notes,
        })),
        notes,
        createdBy: employeeId,
      });
      message.success('Timesheet saved');
      await loadDayTimesheet(store.selectedDate);
      await loadWeeklyTimesheets();
    } catch (err) {
      message.error('Failed to save timesheet');
      console.error(err);
    } finally {
      store.setSavingTimesheet(false);
    }
  }, [site, employeeId, store.selectedDate, store.currentDayTimesheet, loadDayTimesheet, loadWeeklyTimesheets]);

  const submitTimesheet = useCallback(async () => {
    const handle = store.currentDayTimesheet?.handle;
    if (!handle) {
      message.warning('Save timesheet before submitting');
      return;
    }
    store.setSubmittingTimesheet(true);
    try {
      await HrmTimesheetService.submitTimesheet({
        site,
        employeeId,
        timesheetHandle: handle,
        submittedBy: employeeId,
      });
      message.success('Timesheet submitted for approval');
      await loadDayTimesheet(store.selectedDate);
      await loadWeeklyTimesheets();
    } catch (err) {
      message.error('Failed to submit timesheet');
      console.error(err);
    } finally {
      store.setSubmittingTimesheet(false);
    }
  }, [site, employeeId, store.selectedDate, store.currentDayTimesheet, loadDayTimesheet, loadWeeklyTimesheets]);

  const submitWeek = useCallback(async () => {
    store.setSubmittingWeek(true);
    try {
      const result = await HrmTimesheetService.bulkSubmitWeekly({
        site,
        employeeId,
        weekStartDate: store.selectedWeekStart,
        submittedBy: employeeId,
      });
      message.success(`Week submitted: ${result.submitted} days`);
      await loadWeeklyTimesheets();
    } catch (err) {
      message.error('Failed to submit week');
      console.error(err);
    } finally {
      store.setSubmittingWeek(false);
    }
  }, [site, employeeId, store.selectedWeekStart, loadWeeklyTimesheets]);

  const approveTimesheet = useCallback(async (handle: string, action: 'APPROVED' | 'REJECTED', remarks: string) => {
    store.setApprovingTimesheet(true);
    try {
      await HrmTimesheetService.approveOrReject({
        site,
        timesheetHandle: handle,
        action,
        remarks,
        approverEmployeeId: employeeId,
      });
      message.success(`Timesheet ${action.toLowerCase()}`);
      await loadPendingApprovals();
      store.setSelectedTimesheetHandle(null);
    } catch (err) {
      message.error('Failed to process approval');
      console.error(err);
    } finally {
      store.setApprovingTimesheet(false);
    }
  }, [site, employeeId, loadPendingApprovals]);

  const copyFromPreviousDay = useCallback(async () => {
    store.setSavingTimesheet(true);
    try {
      const data = await HrmTimesheetService.copyFromPreviousDay(site, employeeId, store.selectedDate, employeeId);
      store.setCurrentDayTimesheet({
        handle: data.handle,
        site: data.site,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department,
        buCode: data.buCode,
        supervisorId: data.supervisorId,
        date: data.date,
        lines: data.lines.map((l) => ({
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
        totalHours: data.totalHours,
        colorCode: data.colorCode,
        status: data.status,
        notes: data.notes,
        version: data.version,
        isHoliday: data.isHoliday,
        isLeaveDay: data.isLeaveDay,
        leaveType: data.leaveType,
        active: data.active,
        createdDateTime: data.createdDateTime,
        modifiedDateTime: data.modifiedDateTime,
      });
      message.success('Copied from previous day');
    } catch (err) {
      message.warning('No previous day data to copy');
    } finally {
      store.setSavingTimesheet(false);
    }
  }, [site, employeeId, store.selectedDate]);

  return {
    saveTimesheet,
    submitTimesheet,
    submitWeek,
    approveTimesheet,
    copyFromPreviousDay,
  };
}
