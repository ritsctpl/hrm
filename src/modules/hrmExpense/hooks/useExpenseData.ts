"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../services/hrmExpenseService";
import { useHrmExpenseStore } from "../stores/hrmExpenseStore";
import { normalizeDateToISO } from "../utils/dateHelpers";

export function useExpenseData() {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId =
    cookies.employeeId ??
    cookies.employeeCode ??
    cookies.username ??
    cookies.userId ??
    cookies.user ??
    cookies.rl_user_id ??
    "";

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

  const loadMyExpenses = useCallback(async () => {
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
  }, [organizationId, employeeId, statusFilter, typeFilter, searchTerm, dateRange]);

  const loadSupervisorInbox = useCallback(async () => {
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
  }, [organizationId, employeeId]);

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
    try {
      const data = await HrmExpenseService.getUnsettledAdvances({ organizationId, empId: employeeId });
      return data;
    } catch {
      return [];
    }
  }, [organizationId, employeeId]);

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
