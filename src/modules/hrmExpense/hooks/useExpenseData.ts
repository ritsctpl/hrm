"use client";

import { useCallback } from "react";
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmExpenseService } from "../services/hrmExpenseService";
import { useHrmExpenseStore } from "../stores/hrmExpenseStore";

export function useExpenseData() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.userId ?? "";

  const {
    setMyExpenses,
    setListLoading,
    setSupervisorInbox,
    setFinanceInbox,
    setInboxLoading,
    setSelectedExpense,
    setDetailLoading,
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
      const data = await HrmExpenseService.getMyExpenses({
        site,
        employeeId,
        status: statusFilter as never,
        expenseType: typeFilter as never,
        searchTerm: searchTerm || undefined,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
      });
      setMyExpenses(data);
    } catch {
      message.error("Failed to load expense reports.");
      setError("Failed to load expenses.");
    } finally {
      setListLoading(false);
    }
  }, [site, employeeId, statusFilter, typeFilter, searchTerm, dateRange]);

  const loadSupervisorInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const data = await HrmExpenseService.getSupervisorInbox({
        site,
        empId: employeeId,
      });
      setSupervisorInbox(data);
    } catch {
      message.error("Failed to load approval inbox.");
    } finally {
      setInboxLoading(false);
    }
  }, [site, employeeId]);

  const loadFinanceInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const data = await HrmExpenseService.getFinanceInbox({ site });
      setFinanceInbox(data);
    } catch {
      message.error("Failed to load finance inbox.");
    } finally {
      setInboxLoading(false);
    }
  }, [site]);

  const loadExpenseDetail = useCallback(async (handle: string) => {
    setDetailLoading(true);
    try {
      const data = await HrmExpenseService.getExpenseByHandle({ handle });
      setSelectedExpense(data);
    } catch {
      message.error("Failed to load expense details.");
    } finally {
      setDetailLoading(false);
    }
  }, [site]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await HrmExpenseService.getCategories({ site });
      setCategories(data);
    } catch {
      // non-critical, silently fail
    }
  }, [site]);

  const loadMileageConfig = useCallback(async () => {
    try {
      const data = await HrmExpenseService.getMileageConfig({ site });
      setMileageConfig(data);
    } catch {
      // non-critical
    }
  }, [site]);

  const exportExpenses = useCallback(async () => {
    try {
      const blob = await HrmExpenseService.exportExpenses({
        site,
        startDate: dateRange?.[0] ?? "",
        endDate: dateRange?.[1] ?? "",
        status: statusFilter || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-reports-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success("Export downloaded.");
    } catch {
      message.error("Failed to export expense reports.");
    }
  }, [site, statusFilter, dateRange]);

  const loadUnsettledAdvances = useCallback(async () => {
    try {
      const data = await HrmExpenseService.getUnsettledAdvances({ site, empId: employeeId });
      return data;
    } catch {
      return [];
    }
  }, [site, employeeId]);

  return {
    loadMyExpenses,
    loadSupervisorInbox,
    loadFinanceInbox,
    loadExpenseDetail,
    loadCategories,
    loadMileageConfig,
    exportExpenses,
    loadUnsettledAdvances,
  };
}
