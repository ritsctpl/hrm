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
      const payload = {
        site,
        employeeId,
        expenseType: form.expenseType as ExpenseType,
        purpose: form.purpose,
        travelRefHandle: form.travelRefHandle || undefined,
        fromDate: form.fromDate!,
        toDate: form.toDate!,
        costCenter: form.costCenter,
        projectCode: form.projectCode || undefined,
        wbsCode: form.wbsCode || undefined,
        currency: form.currency,
        exchangeRate: form.exchangeRate,
        outOfPolicyJustification: form.outOfPolicyJustification || undefined,
      };
      if (existingHandle) {
        const updated = await HrmExpenseService.updateDraft({ ...payload, handle: existingHandle });
        updateMyExpense(existingHandle, updated);
        setSelectedExpense(updated);
        message.success("Draft saved.");
        return updated;
      } else {
        const created = await HrmExpenseService.createDraft(payload);
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
      const updated = await HrmExpenseService.submitExpense({ site, handle });
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
  }, [site]);

  const supervisorApprove = useCallback(async (handle: string, remarks?: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.supervisorApprove({
        site, handle, approverId: employeeId, remarks,
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
  }, [site, employeeId]);

  const supervisorReject = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.supervisorReject({
        site, handle, approverId: employeeId, remarks,
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
  }, [site, employeeId]);

  const financeSanction = useCallback(async (handle: string, panel: FinancePanelState) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.financeSanction({
        site,
        handle,
        financeId: employeeId,
        sanctionedAmount: panel.sanctionedAmount!,
        perDiem: panel.perDiem ?? undefined,
        exchangeRate: panel.exchangeRate,
        originalsReceived: panel.originalsReceived,
        remarks: panel.remarks || undefined,
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
  }, [site, employeeId]);

  const financeReject = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.financeReject({
        site, handle, approverId: employeeId, remarks,
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
  }, [site, employeeId]);

  const markAsPaid = useCallback(async (handle: string, panel: FinancePanelState) => {
    setApproving(true);
    try {
      const updated = await HrmExpenseService.markAsPaid({
        site,
        handle,
        financeId: employeeId,
        paymentMode: panel.paymentMode as PaymentMode,
        paymentReference: panel.paymentReference,
        paymentDate: panel.paymentDate!,
        remarks: panel.remarks || undefined,
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
  }, [site, employeeId]);

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

  const deleteExpense = useCallback(async (handle: string) => {
    setSaving(true);
    try {
      await HrmExpenseService.deleteExpense({ site, handle });
      removeMyExpense(handle);
      setSelectedExpense(null);
      setScreenMode("list");
      message.success("Expense report deleted.");
    } catch {
      message.error("Failed to delete expense.");
    } finally {
      setSaving(false);
    }
  }, [site]);

  return {
    saveDraft,
    submitExpense,
    supervisorApprove,
    supervisorReject,
    financeSanction,
    financeReject,
    markAsPaid,
    cancelExpense,
    deleteExpense,
  };
}
