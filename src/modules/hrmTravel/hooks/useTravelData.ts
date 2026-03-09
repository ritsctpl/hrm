"use client";

import { useCallback } from "react";
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";

export function useTravelData() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.employeeId ?? cookies.userId ?? cookies.user ?? cookies.rl_user_id ?? "";

  const {
    setMyRequests,
    setListLoading,
    setApproverInbox,
    setInboxLoading,
    setSelectedRequest,
    setDetailLoading,
    setError,
    statusFilter,
    typeFilter,
    searchTerm,
    dateRange,
    activeInboxTab,
  } = useHrmTravelStore();

  const loadMyRequests = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const data = await HrmTravelService.getMyRequests({
        site,
        employeeId,
        status: statusFilter as never,
        travelType: typeFilter as never,
        searchTerm: searchTerm || undefined,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
      });
      setMyRequests(data);
    } catch {
      message.error("Failed to load travel requests.");
      setError("Failed to load travel requests.");
    } finally {
      setListLoading(false);
    }
  }, [site, employeeId, statusFilter, typeFilter, searchTerm, dateRange]);

  const loadApproverInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const data = await HrmTravelService.getApproverInbox({
        site,
        empId: employeeId,
        inboxType: activeInboxTab === "pending" ? "PENDING" : activeInboxTab === "escalated" ? "ESCALATED" : "DECIDED",
      });
      setApproverInbox(data);
    } catch {
      message.error("Failed to load approval inbox.");
    } finally {
      setInboxLoading(false);
    }
  }, [site, employeeId, activeInboxTab]);

  const loadRequestDetail = useCallback(async (handle: string) => {
    setDetailLoading(true);
    try {
      const data = await HrmTravelService.getRequestByHandle({ site, handle });
      setSelectedRequest(data);
    } catch {
      message.error("Failed to load request details.");
    } finally {
      setDetailLoading(false);
    }
  }, [site]);

  const loadPolicies = useCallback(async () => {
    try {
      const data = await HrmTravelService.getPolicies({ site });
      useHrmTravelStore.getState().setPolicies(data);
    } catch {
      // non-critical, silently fail
    }
  }, [site]);

  const exportRequests = useCallback(async () => {
    try {
      const blob = await HrmTravelService.exportRequests({
        site,
        employeeId,
        status: statusFilter as never,
        travelType: typeFilter as never,
        searchTerm: searchTerm || undefined,
        fromDate: dateRange?.[0],
        toDate: dateRange?.[1],
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `travel-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success("Export downloaded.");
    } catch {
      message.error("Failed to export travel requests.");
    }
  }, [site, employeeId, statusFilter, typeFilter, searchTerm, dateRange]);

  return { loadMyRequests, loadApproverInbox, loadRequestDetail, loadPolicies, exportRequests };
}
