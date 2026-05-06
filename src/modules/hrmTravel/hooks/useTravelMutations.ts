"use client";

import { useCallback } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { message } from "antd";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";
import { useEmployeeIdentity } from "../../hrmAccess/hooks/useEmployeeIdentity";
import type { TravelFormState } from "../types/ui.types";
import type { TravelMode, TravelType } from "../types/domain.types";

export function useTravelMutations() {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  // Backend enforces composite "EMP001 - Full Name" for actor fields
  // (submittedBy, createdBy, actorEmpId, cancelledBy, deletedBy).
  const actorId = identity.employeeIdWithName;
  const actorName = identity.fullName || identity.employeeCode;

  const {
    setSaving,
    setSubmitting,
    setApproving,
    addMyRequest,
    updateMyRequest,
    removeMyRequest,
    removeFromInbox,
    updateInboxRequest,
    setSelectedRequest,
    setScreenMode,
  } = useHrmTravelStore();

  const saveDraft = useCallback(async (form: TravelFormState, existingHandle?: string) => {
    setSaving(true);
    try {
      const payload = {
        organizationId,
        travelType: form.travelType as TravelType,
        purpose: form.purpose,
        destinationCity: form.destinationCity,
        destinationState: form.destinationState || undefined,
        destinationCountry: form.destinationCountry || undefined,
        travelMode: form.travelMode as TravelMode,
        startDate: form.startDate || form.travelDate || "",
        endDate: form.endDate || undefined,
        startHour: form.startHour || undefined,
        endHour: form.endHour || undefined,
        remarks: form.remarks || undefined,
        coTravellerEmpIds: form.coTravellerIds,
        createdBy: actorId,
      };
      if (existingHandle) {
        const updated = await HrmTravelService.updateDraft({ ...payload, handle: existingHandle });
        updateMyRequest(existingHandle, updated);
        setSelectedRequest(updated);
        message.success("Draft saved.");
        return updated;
      } else {
        const created = await HrmTravelService.createDraft(payload);
        addMyRequest(created);
        setSelectedRequest(created);
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
  }, [organizationId, actorId]);

  const submitRequest = useCallback(async (handle: string) => {
    setSubmitting(true);
    try {
      const updated = await HrmTravelService.submitRequest({ organizationId, handle, submittedBy: actorId });
      updateMyRequest(handle, updated);
      setSelectedRequest(updated);
      message.success("Travel request submitted successfully.");
      return updated;
    } catch {
      message.error("Failed to submit request.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [organizationId, actorId]);

  const approveRequest = useCallback(async (handle: string, remarks?: string) => {
    setApproving(true);
    try {
      const updated = await HrmTravelService.approveRequest({ organizationId,
        travelRequestHandle: handle,
        action: "APPROVE",
        actorEmpId: actorId,
        actorName,
        actorRole: "SUPERVISOR",
        remarks,
      });
      updateInboxRequest(handle, updated);
      removeFromInbox(handle);
      setSelectedRequest(null);
      message.success("Request approved.");
      return updated;
    } catch {
      message.error("Failed to approve request.");
      return null;
    } finally {
      setApproving(false);
    }
  }, [organizationId, actorId, actorName]);

  const rejectRequest = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmTravelService.rejectRequest({ organizationId,
        travelRequestHandle: handle,
        action: "REJECT",
        actorEmpId: actorId,
        actorName,
        actorRole: "SUPERVISOR",
        remarks,
      });
      updateInboxRequest(handle, updated);
      removeFromInbox(handle);
      setSelectedRequest(null);
      message.success("Request rejected.");
      return updated;
    } catch {
      message.error("Failed to reject request.");
      return null;
    } finally {
      setApproving(false);
    }
  }, [organizationId, actorId, actorName]);

  const cancelRequest = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmTravelService.cancelRequest({ handle, cancelledBy: actorId, reason });
      updateMyRequest(handle, updated);
      setSelectedRequest(updated);
      message.success("Request cancelled.");
      return updated;
    } catch {
      message.error("Failed to cancel request.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [organizationId, actorId]);

  const recallRequest = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmTravelService.recallRequest({ organizationId, handle, reason });
      updateMyRequest(handle, updated);
      setSelectedRequest(updated);
      message.success("Request recalled to draft.");
      return updated;
    } catch {
      message.error("Failed to recall request.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [organizationId]);

  const deleteRequest = useCallback(async (handle: string) => {
    setSaving(true);
    try {
      await HrmTravelService.deleteRequest({ organizationId, requestId: handle, deletedBy: actorId });
      removeMyRequest(handle);
      setSelectedRequest(null);
      setScreenMode("list");
      message.success("Request deleted.");
    } catch {
      message.error("Failed to delete request.");
    } finally {
      setSaving(false);
    }
  }, [organizationId, actorId]);

  return {
    saveDraft,
    submitRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    recallRequest,
    deleteRequest,
  };
}
