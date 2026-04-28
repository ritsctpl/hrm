"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { HrmExpenseService } from "../services/hrmExpenseService";
import { useHrmExpenseStore } from "../stores/hrmExpenseStore";
import { normalizeDateToISO } from "../utils/dateHelpers";
import { useEmployeeIdentity } from "../../hrmAccess/hooks/useEmployeeIdentity";

export function useExpenseData() {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  const employeeId = identity.employeeCode;

  const {
    setMyExpenses,
    setListLoading,
    setSupervisorInbox,
    setFinanceInbox,
    setInboxLoading,
    setCategories,
    setMileageConfig,
    setError,
    statusFilter,
    typeFilter,
    searchTerm,
    dateRange,
  } = useHrmExpenseStore();

  // Gate backend calls on identity.isReady — until the directory lookup
  // completes, employeeId may be a login-email fallback which no backend
  // accepts as an employee identifier. Each loader early-returns; the
  // useCallback deps include isReady so callers' useEffects re-fire once
  // the identity resolves.
  const isReady = identity.isReady;

  const loadMyExpenses = useCallback(async () => {
    if (!isReady) return;
    setListLoading(true);
    setError(null);
    try {
      const data = await HrmExpenseService.getMyExpenses({ organizationId,
        employeeId,
        status: statusFilter as never,
        expenseType: typeFilter as never,
        searchTerm: searchTerm || undefined,
        fromDate: normalizeDateToISO(dateRange?.[0]),
        toDate: normalizeDateToISO(dateRange?.[1]),
      });
      setMyExpenses(data);
    } catch {
      message.error("Failed to load expense reports.");
      setError("Failed to load expenses.");
    } finally {
      setListLoading(false);
    }
  }, [organizationId, employeeId, isReady, statusFilter, typeFilter, searchTerm, dateRange]);

  const loadSupervisorInbox = useCallback(async () => {
    if (!isReady) return;
    setInboxLoading(true);
    try {
      const data = await HrmExpenseService.getSupervisorInbox({ organizationId,
        empId: employeeId,
      });
      setSupervisorInbox(data);
    } catch {
      message.error("Failed to load approval inbox.");
    } finally {
      setInboxLoading(false);
    }
  }, [organizationId, employeeId, isReady]);

  const loadFinanceInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const data = await HrmExpenseService.getFinanceInbox({ organizationId });
      setFinanceInbox(data);
    } catch {
      message.error("Failed to load finance inbox.");
    } finally {
      setInboxLoading(false);
    }
  }, [organizationId]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await HrmExpenseService.getCategories({ organizationId });
      setCategories(data);
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      console.error("[Expense] Failed to load categories:", error);
      message.error(backendMessage || "Failed to load expense categories.");
    }
  }, [organizationId]);

  const loadMileageConfig = useCallback(async () => {
    try {
      const data = await HrmExpenseService.getMileageConfig({ organizationId });
      setMileageConfig(data);
    } catch {
      // non-critical
    }
  }, [organizationId]);

  const exportExpenses = useCallback(async () => {
    try {
      const blob = await HrmExpenseService.exportExpenses({ organizationId,
        startDate: normalizeDateToISO(dateRange?.[0]),
        endDate: normalizeDateToISO(dateRange?.[1]),
        status: statusFilter || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-reports-${new Date().toISOString().slice(0, 10)}.csv`;
      // Firefox/Safari ignore .click() on detached anchors — append first.
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success("Export downloaded.");
    } catch {
      message.error("Failed to export expense reports.");
    }
  }, [organizationId, statusFilter, dateRange]);

  const loadUnsettledAdvances = useCallback(async () => {
    if (!isReady) return [];
    try {
      const data = await HrmExpenseService.getUnsettledAdvances({ organizationId, empId: employeeId });
      return data;
    } catch {
      return [];
    }
  }, [organizationId, employeeId, isReady]);

  return {
    loadMyExpenses,
    loadSupervisorInbox,
    loadFinanceInbox,
    loadCategories,
    loadMileageConfig,
    exportExpenses,
    loadUnsettledAdvances,
  };
}
