"use client";

import { useCallback } from "react";
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../services/hrmExpenseService";
import { useHrmExpenseStore } from "../stores/hrmExpenseStore";
import type { ExpenseFormState, FinancePanelState } from "../types/ui.types";
import type { ExpenseType, PaymentMode } from "../types/domain.types";

export function useExpenseMutations() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.userId ?? "";
  const employeeName = cookies.userName ?? employeeId;

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
  } = useHrmExpenseStore();

  const saveDraft = useCallback(async (form: ExpenseFormState, existingHandle?: string) => {
    setSaving(true);
    try {
      const basePayload = {
        site,
        expenseType: form.expenseType as ExpenseType,
        purpose: form.purpose,
        travelRequestHandle: form.travelRequestHandle || undefined,
        fromDate: form.fromDate!,
        toDate: form.toDate!,
        costCenter: form.costCenter || undefined,
        projectCode: form.projectCode || undefined,
        wbsCode: form.wbsCode || undefined,
        currency: form.currency,
        outOfPolicyJustification: form.outOfPolicyJustification || undefined,
        items: [],
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
    } catch {
      message.error("Failed to save draft.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [site, employeeId]);

  const submitExpense = useCallback(async (handle: string) => {
    setSubmitting(true);
    try {
      const updated = await HrmExpenseService.submitExpense({ site, handle, submittedBy: employeeId });
      updateMyExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Expense report submitted.");
      return updated;
    } catch {
      message.error("Failed to submit expense report.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [site, employeeId]);

  const supervisorApprove = useCallback(async (handle: string, remarks?: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.supervisorApprove({
        site, expenseRequestHandle: handle, action: "APPROVE", actorEmpId: employeeId, actorName: employeeName, remarks,
      });
      updateInboxExpense(handle, updated);
      removeFromInbox(handle);
      setSelectedExpense(null);
      message.success("Expense approved and forwarded to Finance.");
      return updated;
    } catch {
      message.error("Failed to approve expense.");
      return null;
    } finally {
      setApproving(false);
    }
  }, [site, employeeId, employeeName]);

  const supervisorReject = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.supervisorReject({
        site, expenseRequestHandle: handle, action: "REJECT", actorEmpId: employeeId, actorName: employeeName, remarks,
      });
      updateInboxExpense(handle, updated);
      removeFromInbox(handle);
      setSelectedExpense(null);
      message.success("Expense rejected.");
      return updated;
    } catch {
      message.error("Failed to reject expense.");
      return null;
    } finally {
      setApproving(false);
    }
  }, [site, employeeId, employeeName]);

  const financeSanction = useCallback(async (handle: string, panel: FinancePanelState) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.financeSanction({
        site,
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
    } catch {
      message.error("Failed to sanction expense.");
      return null;
    } finally {
      setApproving(false);
    }
  }, [site, employeeId, employeeName]);

  const financeReject = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.financeReject({
        site, expenseRequestHandle: handle, action: "REJECT", actorEmpId: employeeId, actorName: employeeName, remarks,
      });
      updateInboxExpense(handle, updated);
      removeFromInbox(handle);
      setSelectedExpense(null);
      message.success("Expense rejected by Finance.");
      return updated;
    } catch {
      message.error("Failed to reject expense.");
      return null;
    } finally {
      setApproving(false);
    }
  }, [site, employeeId, employeeName]);

  const markAsPaid = useCallback(async (handle: string, panel: FinancePanelState) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.markAsPaid({
        site,
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
    } catch {
      message.error("Failed to mark as paid.");
      return null;
    } finally {
      setApproving(false);
    }
  }, [site, employeeId, employeeName]);

  const cancelExpense = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmExpenseService.cancelExpense({ site, handle, reason });
      updateMyExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Expense report cancelled.");
      return updated;
    } catch {
      message.error("Failed to cancel expense.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [site]);

  const recallExpense = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmExpenseService.recallExpense({ site, expenseId: handle, recalledBy: employeeId, reason });
      updateMyExpense(handle, updated);
      setSelectedExpense(updated);
      message.success("Expense report recalled to draft.");
      return updated;
    } catch {
      message.error("Failed to recall expense.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [site, employeeId]);

  const deleteExpense = useCallback(async (handle: string) => {
    setSaving(true);
    try {
      await HrmExpenseService.deleteExpense({ site, expenseId: handle, deletedBy: employeeId });
      removeMyExpense(handle);
      setSelectedExpense(null);
      setScreenMode("list");
      message.success("Expense report deleted.");
    } catch {
      message.error("Failed to delete expense.");
    } finally {
      setSaving(false);
    }
  }, [site, employeeId]);

  return {
    saveDraft,
    submitExpense,
    supervisorApprove,
    supervisorReject,
    financeSanction,
    financeReject,
    markAsPaid,
    cancelExpense,
    recallExpense,
    deleteExpense,
  };
}
