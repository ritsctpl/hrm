'use client';
// src/modules/hrmTimesheet/hooks/useHrmTimesheetUI.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmTimesheetStore } from '../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../services/hrmTimesheetService';
import { mapTimesheetResponse, useHrmTimesheetData } from './useHrmTimesheetData';
import { resolveEmployeeId } from '../utils/resolveEmployeeId';

export function useHrmTimesheetUI() {
  const store = useHrmTimesheetStore();
  const { loadWeeklyTimesheets, loadDayTimesheet, loadPendingApprovals } = useHrmTimesheetData();
  const organizationId = getOrganizationId();
  const cookies = parseCookies();
  const employeeId = resolveEmployeeId(cookies);
  const approverName =
    (cookies as Record<string, string | undefined>).employeeName ??
    (cookies as Record<string, string | undefined>).fullName ??
    (cookies as Record<string, string | undefined>).username ??
    employeeId;

  const saveTimesheet = useCallback(async (notes?: string) => {
    const lines = store.currentDayTimesheet?.lines ?? [];
    if (lines.length === 0) {
      message.warning('No timesheet lines to save');
      return;
    }
    store.setSavingTimesheet(true);
    try {
      await HrmTimesheetService.saveTimesheet({ organizationId,
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
  }, [organizationId, employeeId, store.selectedDate, store.currentDayTimesheet, loadDayTimesheet, loadWeeklyTimesheets]);

  const submitTimesheet = useCallback(async () => {
    const handle = store.currentDayTimesheet?.handle;
    if (!handle) {
      message.warning('Save timesheet before submitting');
      return;
    }
    store.setSubmittingTimesheet(true);
    try {
      await HrmTimesheetService.submitTimesheet({ organizationId,
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
  }, [organizationId, employeeId, store.selectedDate, store.currentDayTimesheet, loadDayTimesheet, loadWeeklyTimesheets]);

  const submitWeek = useCallback(async () => {
    store.setSubmittingWeek(true);
    try {
      const result = await HrmTimesheetService.bulkSubmitWeekly({ organizationId,
        employeeId,
        weekStartDate: store.selectedWeekStart,
        submittedBy: employeeId,
      });
      if (result.submittedDays === 0 && (result.skippedDays ?? 0) > 0) {
        message.info('All days already submitted for this week');
      } else {
        message.success(`Week submitted: ${result.submittedDays} day(s) submitted`);
      }
      if (result.errors?.length) {
        message.warning(`${result.errors.length} day(s) failed to submit`);
      }
      await loadWeeklyTimesheets();
    } catch (err) {
      message.error('Failed to submit week');
      console.error(err);
    } finally {
      store.setSubmittingWeek(false);
    }
  }, [organizationId, employeeId, store.selectedWeekStart, loadWeeklyTimesheets]);

  const approveTimesheet = useCallback(async (handle: string, action: 'APPROVED' | 'REJECTED', remarks: string) => {
    store.setApprovingTimesheet(true);
    try {
      await HrmTimesheetService.approveOrReject({ organizationId,
        timesheetHandle: handle,
        action,
        remarks,
        approverEmployeeId: employeeId,
        approverName,
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
  }, [organizationId, employeeId, approverName, loadPendingApprovals]);

  const bulkApproveTimesheets = useCallback(async (handles: string[], action: 'APPROVED' | 'REJECTED', remarks: string) => {
    if (handles.length === 0) {
      message.warning('No timesheets selected');
      return;
    }
    store.setApprovingTimesheet(true);
    try {
      const result = await HrmTimesheetService.bulkApproveOrReject({ organizationId,
        timesheetHandles: handles,
        action,
        remarks,
        approverEmployeeId: employeeId,
        approverName,
      });
      message.success(`Bulk ${action.toLowerCase()}: ${result.successful ?? 0} processed, ${result.failed ?? 0} failed`);
      await loadPendingApprovals();
      store.setSelectedTimesheetHandle(null);
    } catch (err) {
      message.error('Failed to process bulk approval');
      console.error(err);
    } finally {
      store.setApprovingTimesheet(false);
    }
  }, [organizationId, employeeId, approverName, loadPendingApprovals]);

  const reopenTimesheet = useCallback(async (handle: string, reason: string) => {
    store.setApprovingTimesheet(true);
    try {
      await HrmTimesheetService.reopenTimesheet({ organizationId,
        timesheetHandle: handle,
        reopenedBy: employeeId,
        reason,
      });
      message.success('Timesheet reopened');
      await loadPendingApprovals();
      store.setSelectedTimesheetHandle(null);
    } catch (err) {
      message.error('Failed to reopen timesheet');
      console.error(err);
    } finally {
      store.setApprovingTimesheet(false);
    }
  }, [organizationId, employeeId, loadPendingApprovals]);

  const copyFromPreviousDay = useCallback(async () => {
    store.setSavingTimesheet(true);
    try {
      const data = await HrmTimesheetService.copyFromPreviousDay(organizationId, employeeId, store.selectedDate, employeeId);
      store.setCurrentDayTimesheet(mapTimesheetResponse(data));
      message.success('Copied from previous day');
    } catch (err) {
      message.warning('No previous day data to copy');
    } finally {
      store.setSavingTimesheet(false);
    }
  }, [organizationId, employeeId, store.selectedDate]);

  return {
    saveTimesheet,
    submitTimesheet,
    submitWeek,
    approveTimesheet,
    bulkApproveTimesheets,
    reopenTimesheet,
    copyFromPreviousDay,
  };
}
