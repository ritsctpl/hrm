"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";

export function useTravelData() {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId = cookies.employeeId ?? cookies.userId ?? cookies.user ?? cookies.rl_user_id ?? "";

  const {
    setMyRequests,
    setListLoading,
    setApproverInbox,
    setInboxLoading,
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
      const data = await HrmTravelService.getMyRequests({ organizationId,
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
  }, [organizationId, employeeId, statusFilter, typeFilter, searchTerm, dateRange]);

  const loadApproverInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const data = await HrmTravelService.getApproverInbox({ organizationId,
        empId: employeeId,
        inboxType: activeInboxTab === "pending" ? "PENDING" : activeInboxTab === "escalated" ? "ESCALATED" : "DECIDED",
      });
      setApproverInbox(data);
    } catch {
      message.error("Failed to load approval inbox.");
    } finally {
      setInboxLoading(false);
    }
  }, [organizationId, employeeId, activeInboxTab]);

  const loadPolicies = useCallback(async () => {
    try {
      const data = await HrmTravelService.getPolicies({ organizationId });
      useHrmTravelStore.getState().setPolicies(data);
    } catch {
      // non-critical, silently fail
    }
  }, [organizationId]);

  const exportRequests = useCallback(async () => {
    try {
      const blob = await HrmTravelService.exportRequests({ organizationId,
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
  }, [organizationId, employeeId, statusFilter, typeFilter, searchTerm, dateRange]);

  return { loadMyRequests, loadApproverInbox, loadPolicies, exportRequests };
}
