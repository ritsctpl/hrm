"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { HrmExpenseService } from "../services/hrmExpenseService";
import { useHrmExpenseStore } from "../stores/hrmExpenseStore";
import { HrmTravelService } from "../../hrmTravel/services/hrmTravelService";
import { normalizeDateToISO } from "../utils/dateHelpers";
import { extractExpenseError } from "../utils/extractExpenseError";
import { useEmployeeIdentity } from "../../hrmAccess/hooks/useEmployeeIdentity";
import type { ExpenseFormState, FinancePanelState } from "../types/ui.types";
import type { ExpenseType, PaymentMode } from "../types/domain.types";

export function useExpenseMutations() {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  const employeeId = identity.employeeCode;
  const employeeName = identity.fullName || employeeId;

  const {
    setSaving,
    setSubmitting,
    setApproving,
    addMyExpense,
    updateMyExpense,
    removeMyExpense,
    updateInboxExpense,
    removeFromInbox,
    setSelectedExpense,
    setScreenMode,
    draftItems,
  } = useHrmExpenseStore();

  const resolveTravelHandle = useCallback(async (value?: string) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    if (isUuid) return trimmed;
    if (trimmed.startsWith("TR-")) {
      try {
        const requests = await HrmTravelService.getMyRequests({ organizationId, employeeId });
        const match = requests.find((req) => req.requestId === trimmed);
        return match?.handle;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [organizationId, employeeId]);

  const saveDraft = useCallback(async (form: ExpenseFormState, existingHandle?: string) => {
    setSaving(true);
    try {
      const travelHandle = await resolveTravelHandle(form.travelRequestHandle || undefined);
      const basePayload = {
        organizationId,
        expenseType: form.expenseType as ExpenseType,
        purpose: form.purpose,
        travelRequestHandle: travelHandle,
        linkedAdvanceHandle: form.linkedAdvanceHandle || undefined,
        fromDate: normalizeDateToISO(form.fromDate)!,
        toDate: normalizeDateToISO(form.toDate)!,
        costCenter: form.costCenter || undefined,
        projectCode: form.projectCode || undefined,
        wbsCode: form.wbsCode || undefined,
        currency: form.currency,
        outOfPolicyJustification: form.outOfPolicyJustification || undefined,
        items: draftItems.map((item) => ({
          categoryId: item.categoryId,
          expenseDate: normalizeDateToISO(item.expenseDate) ?? item.expenseDate,
          description: item.description,
          amount: item.amount,
          currency: item.currency,
          fromLocation: item.fromLocation || undefined,
          toLocation: item.toLocation || undefined,
          distanceKm: item.distanceKm ?? undefined,
          attachmentRef: item.attachmentRef || undefined,
        })),
        createdBy: employeeId,
      };
      if (existingHandle) {
        const updated = await HrmExpenseService.updateDraft({
          handle: existingHandle,
          data: { ...basePayload },
        });
        updateMyExpense(existingHandle, updated);
        setSelectedExpense(updated);
        message.success("Draft saved.");
        return updated;
      } else {
        const created = await HrmExpenseService.createDraft(basePayload);
        addMyExpense(created);
        setSelectedExpense(created);
        setScreenMode("view");
        message.success("Draft created.");
        return created;
      }
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to save draft."));
      console.error("saveDraft error:", error);
      return null;
    } finally {
      setSaving(false);
    }
  }, [organizationId, employeeId, draftItems, resolveTravelHandle]);

  const submitExpense = useCallback(async (handle: string) => {
    setSubmitting(true);
    try {
      const updated = await HrmExpenseService.submitExpense({ organizationId, handle, submittedBy: employeeId });
      updateMyExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Expense report submitted.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to submit expense report."));
      console.error("submitExpense error:", error);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [organizationId, employeeId]);

  const supervisorApprove = useCallback(async (handle: string, remarks?: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.supervisorApprove({ organizationId, expenseRequestHandle: handle, action: "APPROVE", actorEmpId: employeeId, actorName: employeeName, remarks,
      });
      updateInboxExpense(handle, updated);
      removeFromInbox(handle);
      setSelectedExpense(null);
      message.success("Expense approved and forwarded to Finance.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to approve expense."));
      return null;
    } finally {
      setApproving(false);
    }
  }, [organizationId, employeeId, employeeName]);

  const supervisorReject = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.supervisorReject({ organizationId, expenseRequestHandle: handle, action: "REJECT", actorEmpId: employeeId, actorName: employeeName, remarks,
      });
      updateInboxExpense(handle, updated);
      removeFromInbox(handle);
      setSelectedExpense(null);
      message.success("Expense rejected.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to reject expense."));
      return null;
    } finally {
      setApproving(false);
    }
  }, [organizationId, employeeId, employeeName]);

  const financeSanction = useCallback(async (handle: string, panel: FinancePanelState) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.financeSanction({ organizationId,
        expenseRequestHandle: handle,
        action: "APPROVE",
        sanctionedAmount: panel.sanctionedAmount ?? undefined,
        perDiemAmount: panel.perDiemAmount ?? undefined,
        exchangeRate: panel.exchangeRate,
        originalsReceived: panel.originalsReceived,
        remarks: panel.remarks || undefined,
        actorEmpId: employeeId,
        actorName: employeeName,
      });
      updateInboxExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Expense sanctioned.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to sanction expense."));
      return null;
    } finally {
      setApproving(false);
    }
  }, [organizationId, employeeId, employeeName]);

  const financeReject = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.financeReject({ organizationId, expenseRequestHandle: handle, action: "REJECT", actorEmpId: employeeId, actorName: employeeName, remarks,
      });
      updateInboxExpense(handle, updated);
      removeFromInbox(handle);
      setSelectedExpense(null);
      message.success("Expense rejected by Finance.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to reject expense."));
      return null;
    } finally {
      setApproving(false);
    }
  }, [organizationId, employeeId, employeeName]);

  const markAsPaid = useCallback(async (handle: string, panel: FinancePanelState) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.markAsPaid({ organizationId,
        expenseRequestHandle: handle,
        action: "PAY",
        paymentMode: panel.paymentMode as PaymentMode,
        paymentReference: panel.paymentReference,
        paymentDate: panel.paymentDate!,
        sanctionedAmount: panel.sanctionedAmount ?? undefined,
        remarks: panel.remarks || undefined,
        actorEmpId: employeeId,
        actorName: employeeName,
      });
      updateInboxExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Payment marked successfully.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to mark as paid."));
      return null;
    } finally {
      setApproving(false);
    }
  }, [organizationId, employeeId, employeeName]);

  const cancelExpense = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmExpenseService.cancelExpense({ organizationId, handle, reason });
      updateMyExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Expense report cancelled.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to cancel expense."));
      return null;
    } finally {
      setSaving(false);
    }
  }, [organizationId]);

  const recallExpense = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmExpenseService.recallExpense({ organizationId, expenseId: handle, recalledBy: employeeId, reason });
      updateMyExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Expense report recalled to draft.");
      return updated;
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to recall expense."));
      return null;
    } finally {
      setSaving(false);
    }
  }, [organizationId, employeeId]);

  const markOriginalsReceived = useCallback(
    async (handle: string, received: boolean) => {
      setApproving(true);
      try {
        const updated = await HrmExpenseService.markOriginalsReceived({
          handle,
          received,
          markedBy: employeeId,
        });
        updateInboxExpense(handle, updated);
        updateMyExpense(handle, updated);
        setSelectedExpense(updated);
        message.success(received ? "Originals marked as received." : "Originals receipt cleared.");
        return updated;
      } catch (error: unknown) {
        message.error(extractExpenseError(error, "Failed to update originals-received status."));
        return null;
      } finally {
        setApproving(false);
      }
    },
    [organizationId, employeeId],
  );

  const deleteExpense = useCallback(async (handle: string) => {
    setSaving(true);
    try {
      await HrmExpenseService.deleteExpense({ organizationId, expenseId: handle, deletedBy: employeeId });
      removeMyExpense(handle);
      setSelectedExpense(null);
      setScreenMode("list");
      message.success("Expense report deleted.");
    } catch (error: unknown) {
      message.error(extractExpenseError(error, "Failed to delete expense."));
    } finally {
      setSaving(false);
    }
  }, [organizationId, employeeId]);

  return {
    saveDraft,
    submitExpense,
    supervisorApprove,
    supervisorReject,
    financeSanction,
    financeReject,
    markAsPaid,
    markOriginalsReceived,
    cancelExpense,
    recallExpense,
    deleteExpense,
  };
}
