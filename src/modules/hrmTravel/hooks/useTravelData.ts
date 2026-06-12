"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";
import { useEmployeeIdentity } from "../../hrmAccess/hooks/useEmployeeIdentity";

export function useTravelData() {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  // Filter endpoints (my-requests / approver-inbox / export) match records by
  // bare employeeCode, NOT composite "EMP001 - Full Name".
  const employeeId = identity.employeeCode;

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
    // Gate strictly on `isReady`: until currentEmployeeStore resolves, the
    // `employeeCode` here can be a stale 30-day cookie left over from a
    // PREVIOUS user's session, which would fetch the wrong person's list
    // (the "before-login user data" bug). isReady is true only once the
    // signed-in employee record is authoritatively resolved.
    if (!identity.isReady || !employeeId) return;
    setListLoading(true);
    setError(null);
    try {
      // Fetch the full list for this employee and let the table filter
      // client-side (search / status / type / date). Sending the filters to
      // the API caused redundant per-keystroke calls and an inconsistent UI
      // where the server-filtered response was then re-filtered on the client.
      const data = await HrmTravelService.getMyRequests({ organizationId, employeeId });
      setMyRequests(data);
    } catch {
      message.error("Failed to load travel requests.");
      setError("Failed to load travel requests.");
    } finally {
      setListLoading(false);
    }
  }, [organizationId, employeeId, identity.isReady, setListLoading, setError, setMyRequests]);

  const loadApproverInbox = useCallback(async () => {
    // Same stale-cookie guard as loadMyRequests — don't query the inbox with a
    // previous user's employeeCode before the current identity resolves.
    if (!identity.isReady || !employeeId) return;
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
  }, [organizationId, employeeId, identity.isReady, activeInboxTab, setInboxLoading, setApproverInbox]);

  const loadPolicies = useCallback(async () => {
    try {
      const data = await HrmTravelService.getPolicies({ organizationId });
      useHrmTravelStore.getState().setPolicies(data);
    } catch (err) {
      console.error("Failed to load travel policies:", err);
      message.error("Failed to load travel policies. Admin can still create new policies below.");
      useHrmTravelStore.getState().setPolicies([]);
    }
  }, [organizationId]);

  const exportRequests = useCallback(async () => {
    if (!employeeId) return;  // Only return if employeeId is empty
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
