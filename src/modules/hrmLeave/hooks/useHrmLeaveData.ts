"use client";

import { useCallback } from "react";
import { parseCookies } from "nookies";
import { message } from "antd";
import { useHrmLeaveStore } from "../stores/hrmLeaveStore";
import { HrmLeaveService } from "../services/hrmLeaveService";

export function useHrmLeaveData(employeeId: string, role: string) {
  const cookies = parseCookies();
  const site = cookies.site ?? "";

  const {
    balancesYear,
    setBalances,
    setBalancesLoading,
    setMyRequests,
    setMyRequestsLoading,
    setPendingRequests,
    setPendingRequestsLoading,
    setGlobalQueue,
    setGlobalQueueLoading,
    setLedgerHistory,
    setLedgerLoading,
    ledgerYear,
    ledgerLeaveTypeFilter,
    setLeaveTypes,
    setBalanceSummary,
    setBalanceSummaryLoading,
    ledgerEmployeeId,
  } = useHrmLeaveStore();

  const loadBalances = useCallback(async (empId?: string) => {
    const targetId = empId ?? employeeId;
    if (!targetId) return;
    setBalancesLoading(true);
    try {
      const res = await HrmLeaveService.getEmployeeBalances({
        site,
        employeeId: targetId,
        year: balancesYear,
      });
      setBalances(res as unknown as import("../types/domain.types").LeaveBalance[]);
    } catch {
      message.error("Failed to load leave balances");
    } finally {
      setBalancesLoading(false);
    }
  }, [site, employeeId, balancesYear, setBalances, setBalancesLoading]);

  const loadMyRequests = useCallback(async () => {
    if (!employeeId) return;
    setMyRequestsLoading(true);
    try {
      const res = await HrmLeaveService.getMyRequests({ site, employeeId });
      setMyRequests(res as unknown as import("../types/domain.types").LeaveRequest[]);
    } catch {
      message.error("Failed to load leave requests");
    } finally {
      setMyRequestsLoading(false);
    }
  }, [site, employeeId, setMyRequests, setMyRequestsLoading]);

  const loadPendingForApprover = useCallback(async () => {
    if (!employeeId) return;
    setPendingRequestsLoading(true);
    try {
      const res = await HrmLeaveService.getPendingForApprover({ site, approverId: employeeId });
      setPendingRequests(res as unknown as import("../types/domain.types").LeaveRequest[]);
    } catch {
      message.error("Failed to load approver inbox");
    } finally {
      setPendingRequestsLoading(false);
    }
  }, [site, employeeId, setPendingRequests, setPendingRequestsLoading]);

  const loadGlobalQueue = useCallback(async (filters?: Partial<{ buId: string; deptId: string; status: string; leaveTypeCode: string; slaBreachOnly: string; fromDate: string; toDate: string }>) => {
    setGlobalQueueLoading(true);
    try {
      const res = await HrmLeaveService.getGlobalQueue({
        site,
        buId: filters?.buId,
        deptId: filters?.deptId,
        status: filters?.status,
        leaveTypeCode: filters?.leaveTypeCode,
        slaBreachOnly: filters?.slaBreachOnly === "true",
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
      });
      setGlobalQueue(res as unknown as import("../types/domain.types").LeaveRequest[]);
    } catch {
      message.error("Failed to load global queue");
    } finally {
      setGlobalQueueLoading(false);
    }
  }, [site, setGlobalQueue, setGlobalQueueLoading]);

  const loadLedgerHistory = useCallback(async (empId?: string) => {
    const targetId = empId ?? ledgerEmployeeId ?? employeeId;
    if (!targetId) return;
    setLedgerLoading(true);
    try {
      const res = await HrmLeaveService.getLedgerHistory({
        site,
        employeeId: targetId,
        year: ledgerYear,
        leaveTypeCode: ledgerLeaveTypeFilter ?? undefined,
      });
      setLedgerHistory(res as unknown as import("../types/domain.types").LedgerEntry[]);
    } catch {
      message.error("Failed to load ledger history");
    } finally {
      setLedgerLoading(false);
    }
  }, [site, ledgerYear, ledgerLeaveTypeFilter, ledgerEmployeeId, employeeId, setLedgerHistory, setLedgerLoading]);

  const loadLeaveTypes = useCallback(async () => {
    try {
      const res = await HrmLeaveService.getAllLeaveTypes({ site });
      setLeaveTypes(res);
    } catch {
      message.error("Failed to load leave types");
    }
  }, [site, setLeaveTypes]);

  const loadBalanceSummary = useCallback(async (year: number) => {
    setBalanceSummaryLoading(true);
    try {
      const res = await HrmLeaveService.getBalanceSummaryReport({ site, year });
      // LeaveBalanceResponse is structurally identical to LeaveBalance domain type
      setBalanceSummary(res as unknown as import("../types/domain.types").LeaveBalance[]);
    } catch {
      message.error("Failed to load balance summary");
    } finally {
      setBalanceSummaryLoading(false);
    }
  }, [site, setBalanceSummary, setBalanceSummaryLoading]);

  return {
    loadBalances,
    loadMyRequests,
    loadPendingForApprover,
    loadGlobalQueue,
    loadLedgerHistory,
    loadLeaveTypes,
    loadBalanceSummary,
  };
}
