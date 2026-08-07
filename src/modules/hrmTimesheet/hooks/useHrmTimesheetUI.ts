'use client';
// src/modules/hrmTimesheet/hooks/useHrmTimesheetUI.ts
import { useCallback } from 'react';
import { message } from 'antd';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmTimesheetStore } from '../stores/hrmTimesheetStore';
import { HrmTimesheetService } from '../services/hrmTimesheetService';
import { mapTimesheetResponse, useHrmTimesheetData } from './useHrmTimesheetData';
import { useEmployeeIdentity } from '../../hrmAccess/hooks/useEmployeeIdentity';
import { SOFT_DAILY_HOUR_LIMIT } from '../utils/timesheetConstants';
import { extractBackendMsg } from '../utils/backendMessage';
import type { MatrixLineInput } from '../types/ui.types';

export function useHrmTimesheetUI() {
  const store = useHrmTimesheetStore();
  const { loadWeeklyTimesheets, loadDayTimesheet, loadPendingApprovals, loadMonthlyTimesheets } =
    useHrmTimesheetData();
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  // Identity contract (per backend audit 2026-06-09): the service normalises
  // ids via parseCode(), so the bare employeeCode is correct for own-record
  // AND approver/supervisor fields. approverName carries the display name.
  const employeeId = identity.employeeCode;
  const supervisorId = employeeId;
  const approverName = identity.fullName || employeeId;

  const saveTimesheet = useCallback(async (notes?: string) => {
    const lines = store.currentDayTimesheet?.lines ?? [];
    if (lines.length === 0) {
      message.warning('No timesheet lines to save');
      return;
    }
    // PRD soft validation: warn when the day total exceeds 9h, but still save.
    const totalDayHours = lines.reduce((sum, l) => sum + (l.hours ?? 0), 0);
    if (totalDayHours > SOFT_DAILY_HOUR_LIMIT) {
      message.warning(`Total ${totalDayHours.toFixed(1)}h exceeds the ${SOFT_DAILY_HOUR_LIMIT}h daily limit`);
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
          taskId: l.taskId,
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
    const payload = {
      organizationId,
      employeeId,
      timesheetHandle: handle,
      submittedBy: employeeId,
    };
    try {
      await HrmTimesheetService.submitTimesheet(payload);
      message.success('Timesheet submitted for approval');
      await loadDayTimesheet(store.selectedDate);
      await loadWeeklyTimesheets();
    } catch (err: any) {
      console.error('[submitTimesheet] payload:', payload);
      console.error('[submitTimesheet] response:', err?.response?.data);
      message.error(extractBackendMsg(err, 'Failed to submit timesheet'));
    } finally {
      store.setSubmittingTimesheet(false);
    }
  }, [organizationId, employeeId, store.selectedDate, store.currentDayTimesheet, loadDayTimesheet, loadWeeklyTimesheets]);

  const submitWeek = useCallback(async () => {
    store.setSubmittingWeek(true);
    const payload = {
      organizationId,
      employeeId,
      weekStartDate: store.selectedWeekStart,
      submittedBy: employeeId,
    };
    try {
      const result = await HrmTimesheetService.bulkSubmitWeekly(payload);
      if (result.submittedDays === 0 && (result.skippedDays ?? 0) > 0) {
        message.info('All days already submitted for this week');
      } else {
        message.success(`Week submitted: ${result.submittedDays} day(s) submitted`);
      }
      if (result.errors?.length) {
        message.warning(`${result.errors.length} day(s) failed to submit`);
      }
      await loadWeeklyTimesheets();
    } catch (err: any) {
      console.error('[submitWeek] payload:', payload);
      console.error('[submitWeek] response:', err?.response?.data);
      message.error(extractBackendMsg(err, 'Failed to submit week'));
    } finally {
      store.setSubmittingWeek(false);
    }
  }, [organizationId, employeeId, store.selectedWeekStart, loadWeeklyTimesheets]);

  const approveTimesheet = useCallback(async (handle: string, action: 'APPROVED' | 'REJECTED', remarks: string) => {
    store.setApprovingTimesheet(true);
    const payload = {
      organizationId,
      timesheetHandle: handle,
      action,
      remarks,
      approverEmployeeId: supervisorId,
      approverName,
    };
    try {
      await HrmTimesheetService.approveOrReject(payload);
      message.success(`Timesheet ${action.toLowerCase()}`);
      await loadPendingApprovals();
      store.setSelectedTimesheetHandle(null);
    } catch (err: any) {
      // The server sends a specific, actionable reason ("approval belongs to X", "only
      // SUBMITTED timesheets…", "remarks are mandatory…"). Showing a generic sentence
      // instead is what left CT-2026-473 undiagnosable for the reporter.
      console.error('[approveTimesheet] payload:', payload);
      console.error('[approveTimesheet] response:', err?.response?.data);
      message.error(extractBackendMsg(err, 'Failed to process approval'));
    } finally {
      store.setApprovingTimesheet(false);
    }
  }, [organizationId, supervisorId, approverName, loadPendingApprovals]);

  const bulkApproveTimesheets = useCallback(async (handles: string[], action: 'APPROVED' | 'REJECTED', remarks: string) => {
    if (handles.length === 0) {
      message.warning('No timesheets selected');
      return;
    }
    store.setApprovingTimesheet(true);
    const payload = {
      organizationId,
      timesheetHandles: handles,
      action,
      remarks,
      approverEmployeeId: supervisorId,
      approverName,
    };
    try {
      const result = await HrmTimesheetService.bulkApproveOrReject(payload);
      message.success(`Bulk ${action.toLowerCase()}: ${result.successful ?? 0} processed, ${result.failed ?? 0} failed`);
      // The bulk endpoint reports per-day failures in the body rather than throwing, so a
      // "0 processed, 3 failed" result is a failure the user must see the reason for.
      if ((result.failed ?? 0) > 0 && result.errors?.length) {
        message.warning(result.errors[0]);
      }
      await loadPendingApprovals();
      store.setSelectedTimesheetHandle(null);
    } catch (err: any) {
      console.error('[bulkApproveTimesheets] payload:', payload);
      console.error('[bulkApproveTimesheets] response:', err?.response?.data);
      message.error(extractBackendMsg(err, 'Failed to process bulk approval'));
    } finally {
      store.setApprovingTimesheet(false);
    }
  }, [organizationId, supervisorId, approverName, loadPendingApprovals]);

  const reopenTimesheet = useCallback(async (handle: string, reason: string) => {
    store.setApprovingTimesheet(true);
    try {
      await HrmTimesheetService.reopenTimesheet({ organizationId,
        timesheetHandle: handle,
        reopenedBy: supervisorId,
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
  }, [organizationId, supervisorId, loadPendingApprovals]);

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

  // ── Weekly matrix (PRD redesign) ──────────────────────────────────────────
  // The matrix edits a Sun→Sat week as a project×day grid. We persist per day
  // (the /save endpoint is day-scoped), so this is week-boundary agnostic and
  // avoids the Monday/Sunday mismatch with the backend's weekly endpoints.

  const saveMatrixDays = useCallback(
    async (days: { date: string; lines: MatrixLineInput[]; notes?: string }[]) => {
      const changed = days.filter((d) => d.lines.length > 0);
      if (changed.length === 0) {
        message.warning('Nothing to save');
        return;
      }
      // Soft 9h/day warning (non-blocking), matching single-day editor.
      changed.forEach((d) => {
        const total = d.lines.reduce((s, l) => s + (l.hours ?? 0), 0);
        if (total > SOFT_DAILY_HOUR_LIMIT) {
          message.warning(`${d.date}: ${total.toFixed(1)}h exceeds the ${SOFT_DAILY_HOUR_LIMIT}h daily limit`);
        }
      });
      store.setSavingTimesheet(true);
      try {
        for (const d of changed) {
          await HrmTimesheetService.saveTimesheet({
            organizationId,
            employeeId,
            date: d.date,
            lines: d.lines.map((l) => ({
              lineType: l.lineType,
              projectHandle: l.projectHandle,
              allocationHandle: l.allocationHandle,
              taskId: l.taskId,
              hours: l.hours,
              categoryId: l.categoryId,
              reason: l.reason,
              notes: l.notes,
            })),
            notes: d.notes,
            createdBy: employeeId,
          });
        }
        message.success(`Saved ${changed.length} day(s)`);
        await loadMonthlyTimesheets();
      } catch (err: any) {
        console.error('[saveMatrixDays] response:', err?.response?.data);
        message.error(extractBackendMsg(err, 'Failed to save timesheet'));
      } finally {
        store.setSavingTimesheet(false);
      }
    },
    [organizationId, employeeId, loadMonthlyTimesheets]
  );

  /** Submit the given already-saved day handles (Sun→Sat week), per day. */
  const submitMatrixDays = useCallback(
    async (handles: string[]) => {
      if (handles.length === 0) {
        message.warning('Save the week before submitting');
        return;
      }
      store.setSubmittingWeek(true);
      try {
        for (const handle of handles) {
          await HrmTimesheetService.submitTimesheet({
            organizationId,
            employeeId,
            timesheetHandle: handle,
            submittedBy: employeeId,
          });
        }
        message.success(`Submitted ${handles.length} day(s)`);
        await loadMonthlyTimesheets();
      } catch (err: any) {
        console.error('[submitMatrixDays] response:', err?.response?.data);
        message.error(extractBackendMsg(err, 'Failed to submit timesheet'));
      } finally {
        store.setSubmittingWeek(false);
      }
    },
    [organizationId, employeeId, loadMonthlyTimesheets]
  );

  return {
    saveTimesheet,
    submitTimesheet,
    submitWeek,
    approveTimesheet,
    bulkApproveTimesheets,
    reopenTimesheet,
    copyFromPreviousDay,
    saveMatrixDays,
    submitMatrixDays,
  };
}
