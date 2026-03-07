"use client";

import { useCallback } from "react";
import { message } from "antd";
import { parseCookies } from "nookies";
import { HrmTravelService } from "../services/hrmTravelService";
import { useHrmTravelStore } from "../stores/hrmTravelStore";
import type { TravelFormState } from "../types/ui.types";
import type { TravelMode, TravelType } from "../types/domain.types";

export function useTravelMutations() {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.userId ?? "";

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
        site,
        employeeId,
        travelType: form.travelType as TravelType,
        purpose: form.purpose,
        destinationCity: form.destinationCity,
        destinationState: form.destinationState || undefined,
        destinationCountry: form.destinationCountry || undefined,
        travelMode: form.travelMode as TravelMode,
        travelDate: form.travelDate || undefined,
        startHour: form.startHour || undefined,
        endHour: form.endHour || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        remarks: form.remarks || undefined,
        coTravellerIds: form.coTravellerIds,
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
  }, [site, employeeId]);

  const submitRequest = useCallback(async (handle: string) => {
    setSubmitting(true);
    try {
      const updated = await HrmTravelService.submitRequest({ site, handle });
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
  }, [site]);

  const approveRequest = useCallback(async (handle: string, remarks?: string) => {
    setApproving(true);
    try {
      const updated = await HrmTravelService.approveRequest({
        site,
        handle,
        approverId: employeeId,
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
  }, [site, employeeId]);

  const rejectRequest = useCallback(async (handle: string, remarks: string) => {
    setApproving(true);
    try {
      const updated = await HrmTravelService.rejectRequest({
        site,
        handle,
        approverId: employeeId,
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
  }, [site, employeeId]);

  const cancelRequest = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmTravelService.cancelRequest({ site, handle, reason });
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
  }, [site]);

  const recallRequest = useCallback(async (handle: string, reason: string) => {
    setSaving(true);
    try {
      const updated = await HrmTravelService.recallRequest({ site, handle, reason });
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
  }, [site]);

  const deleteRequest = useCallback(async (handle: string) => {
    setSaving(true);
    try {
      await HrmTravelService.deleteRequest({ site, handle });
      removeMyRequest(handle);
      setSelectedRequest(null);
      setScreenMode("list");
      message.success("Request deleted.");
    } catch {
      message.error("Failed to delete request.");
    } finally {
      setSaving(false);
    }
  }, [site]);

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
