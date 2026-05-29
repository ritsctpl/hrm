"use client";

import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Tabs, Button, Modal, Input, Space, Typography, Card, InputNumber, Select, Tag, message } from "antd";
import {
  SaveOutlined,
  SendOutlined,
  RollbackOutlined,
  DeleteOutlined,
  StopOutlined,
  DollarOutlined,
  CheckOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useEmployeeIdentity } from "../hrmAccess/hooks/useEmployeeIdentity";
import TravelScreenHeader from "./components/organisms/TravelScreenHeader";
import { useHrmTravelStore } from "./stores/hrmTravelStore";
import { useTravelMutations } from "./hooks/useTravelMutations";
import TravelRequestForm from "./components/organisms/TravelRequestForm";
import CoTravellerPanel from "./components/organisms/CoTravellerPanel";
import AttachmentsPanel from "./components/organisms/AttachmentsPanel";
import ApprovalTimeline from "./components/organisms/ApprovalTimeline";
import ApproverChainPanel from "./components/organisms/ApproverChainPanel";
import ApprovalActionBar from "./components/molecules/ApprovalActionBar";
import TravelStatusChip from "./components/atoms/TravelStatusChip";
import Can from "../hrmAccess/components/Can";
import type { TravelRequest } from "./types/domain.types";
import type { CoTravellerDto } from "./types/domain.types";
import type { TravelAdvance } from "./types/api.types";
import { CANCELLABLE_STATUSES, RECALLABLE_STATUSES } from "./utils/travelConstants";
import { isTravelFormValid, validateTravelForm, validateAgainstFreshPolicy } from "./utils/travelValidations";
import { HrmTravelService } from "./services/hrmTravelService";
import styles from "./styles/Travel.module.css";

const { Text, Title } = Typography;

const ADVANCE_STATUS_COLORS: Record<string, string> = {
  REQUESTED: "processing",
  APPROVED: "success",
  SETTLED: "cyan",
  REJECTED: "error",
};

interface Props {
  request: TravelRequest | null;
  mode: "create" | "view";
  isApprover?: boolean;
  onBack: () => void;
  onActionComplete: () => void;
}

const HrmTravelScreen: React.FC<Props> = ({
  request,
  mode,
  isApprover,
  onBack,
  onActionComplete,
}) => {
  const organizationId = getOrganizationId();
  const identity = useEmployeeIdentity();
  // Backend enforces composite "EMP001 - Full Name" for actor fields.
  const actorId = identity.employeeIdWithName;

  const {
    formState,
    updateFormState,
    activeDetailTab,
    setActiveDetailTab,
    approving,
    saving,
    selectedRequest: storeRequest,
    setSelectedRequest,
    updateMyRequest,
    policies,
  } = useHrmTravelStore();

  const { saveDraft, submitRequest, approveRequest, rejectRequest, cancelRequest, recallRequest, deleteRequest } =
    useTravelMutations();

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [recallModal, setRecallModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Co-traveller details (name, department, conflict flag) added during the
  // current session. formState only carries the IDs that get submitted, so
  // for create / edit-draft mode we need a parallel store of full DTOs to
  // render the list — pulling from `request.coTravellers` alone misses any
  // freshly-picked entries on a new request (request is null) and is also
  // empty for an existing draft until a save round-trip refreshes it.
  const [pendingCoTravellers, setPendingCoTravellers] = useState<CoTravellerDto[]>([]);

  // Travel Advance state
  const [advance, setAdvance] = useState<TravelAdvance | null>(null);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number | null>(null);
  const [advanceCurrency, setAdvanceCurrency] = useState("INR");
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceApprovalRemarks, setAdvanceApprovalRemarks] = useState("");
  const [approveAdvanceModal, setApproveAdvanceModal] = useState(false);
  const [settleAdvanceModal, setSettleAdvanceModal] = useState(false);
  const [settleExpenseHandle, setSettleExpenseHandle] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [localMode, setLocalMode] = useState<"create" | "view">(mode);

  // Use store's selectedRequest if available (updated after save/submit), otherwise use prop
  const currentRequest = storeRequest || request;
  
  const isReadonly = localMode === "view" && currentRequest?.status !== "DRAFT";
  const isNew = localMode === "create";
  
  const canCancel = currentRequest && CANCELLABLE_STATUSES.includes(currentRequest.status);
  const canRecall = currentRequest && RECALLABLE_STATUSES.includes(currentRequest.status);
  const canDelete = currentRequest && currentRequest.status === "DRAFT";
  
  // Get blackout periods from the first policy (or all if multiple exist)
  const blackoutPeriods = policies.length > 0 ? policies[0].blackoutPeriods : undefined;
  const policy = policies.length > 0 ? policies.find(p => p.travelType === formState.travelType) || policies[0] : undefined;
  
  const validationCtx = {
    coTravellers: currentRequest?.coTravellers ?? [],
    // For RECALLED requests, allow backdated travel since we're editing an existing request
    allowBackdated: currentRequest?.status === "RECALLED",
    // Pass blackout periods for validation
    blackoutPeriods,
    // Pass policy for validation
    policy,
  };
  const formErrors = isReadonly ? {} : validateTravelForm(formState, validationCtx);
  const formValid = isTravelFormValid(formState, validationCtx);
  const canRequestAdvance = currentRequest && currentRequest.status === "APPROVED" && !advance;
  // Approver/admin can approve REQUESTED advances; finance/admin can settle APPROVED ones.
  const canApproveAdvance = !!(isApprover && advance && advance.status === "REQUESTED");
  const canSettleAdvance = !!(advance && advance.status === "APPROVED");

  // Load advance on mount for approved requests
  useEffect(() => {
    if (currentRequest?.handle && currentRequest.status === "APPROVED") {
      HrmTravelService.retrieveAdvance({ organizationId, handle: currentRequest.handle })
        .then(setAdvance)
        .catch(() => setAdvance(null));
    }
  }, [currentRequest?.handle, currentRequest?.status, organizationId]);

  const handleSaveDraft = useCallback(async () => {
    if (!formValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);

    // Fetch fresh policy and validate before saving
    try {
      const freshPolicies = await HrmTravelService.getPolicies({ organizationId });
      const freshPolicy = freshPolicies.find(p => p.travelType === formState.travelType) || freshPolicies[0];
      
      // Validate against fresh policy
      const policyError = validateAgainstFreshPolicy(formState, freshPolicy);
      if (policyError) {
        message.error(policyError);
        return;
      }
    } catch (err) {
      message.error("Failed to validate against policy. Please try again.");
      return;
    }

    const result = await saveDraft(formState, currentRequest?.handle);
    if (result) {
      setLocalMode("view");
    }
  }, [formState, currentRequest?.handle, formValid, saveDraft, organizationId]);

  const handleSubmit = useCallback(async () => {
    // In view mode (readonly), skip validation - the draft was already saved with valid data
    if (!isReadonly && !formValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);

    // Fetch fresh policy and validate before submitting
    try {
      const freshPolicies = await HrmTravelService.getPolicies({ organizationId });
      const freshPolicy = freshPolicies.find(p => p.travelType === formState.travelType) || freshPolicies[0];
      
      // Validate against fresh policy
      const policyError = validateAgainstFreshPolicy(formState, freshPolicy);
      if (policyError) {
        message.error(policyError);
        return;
      }
    } catch (err) {
      message.error("Failed to validate against policy. Please try again.");
      return;
    }

    let handle = currentRequest?.handle;
    if (!handle) {
      // Ensure form state has the latest co-travellers before saving
      const updatedFormState = {
        ...formState,
        coTravellerIds: formState.coTravellerIds && formState.coTravellerIds.length > 0 
          ? formState.coTravellerIds 
          : pendingCoTravellers.map(t => t.employeeId),
      };
      const saved = await saveDraft(updatedFormState, undefined);
      if (!saved) return;
      handle = saved.handle;
    }

    // Call update API first before submitting
    try {
      await HrmTravelService.updateDraft({
        handle,
        organizationId,
        travelType: formState.travelType,
        purpose: formState.purpose,
        destinationCity: formState.destinationCity,
        destinationState: formState.destinationState,
        destinationCountry: formState.destinationCountry,
        travelMode: formState.travelMode,
        startDate: formState.startDate || formState.travelDate,
        endDate: formState.endDate,
        startHour: formState.startHour,
        endHour: formState.endHour,
        remarks: formState.remarks,
        coTravellerEmpIds: formState.coTravellerIds,
        base64Docu: formState.attachmentRefs,
        deletedAttachmentIds: formState.deletedAttachmentIds,
        createdBy: actorId,
      });
    } catch (err) {
      // Extract detailed error message from backend response
      let errorMessage = "Failed to update request. Please try again.";
      
      if (err instanceof Error) {
        // First priority: use the error message (already extracted by API interceptor)
        if (err.message) {
          errorMessage = err.message;
        }
      }
      
      message.error(errorMessage);
      return;
    }

    await submitRequest(handle);
    onActionComplete();
  }, [formState, currentRequest?.handle, formValid, isReadonly, saveDraft, submitRequest, onActionComplete, organizationId, actorId, pendingCoTravellers]);

  const handleCoTravellerAdd = (traveller: CoTravellerDto) => {
    if (!formState.coTravellerIds.includes(traveller.employeeId)) {
      updateFormState({ coTravellerIds: [...formState.coTravellerIds, traveller.employeeId] });
    }
    setPendingCoTravellers((prev) =>
      prev.some((p) => p.employeeId === traveller.employeeId) ? prev : [...prev, traveller],
    );
  };

  const handleCoTravellerRemove = (employeeId: string) => {
    updateFormState({
      coTravellerIds: formState.coTravellerIds.filter((id) => id !== employeeId),
    });
    setPendingCoTravellers((prev) => prev.filter((p) => p.employeeId !== employeeId));
  };

  // Reset session-pending entries when switching requests / leaving create.
  // Without this, the list from a freshly-cancelled new request would leak
  // into the next "New Request" click.
  useEffect(() => {
    setPendingCoTravellers([]);
    // Clear pending attachments and deleted attachment IDs when switching requests
    updateFormState({ attachmentRefs: undefined, deletedAttachmentIds: undefined });
    // For RECALLED and DRAFT requests, enable edit mode so employee can modify and resubmit
    if (currentRequest?.status === "RECALLED" || currentRequest?.status === "DRAFT") {
      setLocalMode("create");
    } else {
      setLocalMode(mode);
    }
  }, [currentRequest?.handle, currentRequest?.status, mode]);

  // When a RECALLED or DRAFT request is loaded, populate the form with its existing values
  useEffect(() => {
    if ((currentRequest?.status === "RECALLED" || currentRequest?.status === "DRAFT") && currentRequest) {
      // Convert dates from backend format (YYYY-MM-DD or ISO) to DD/MM/YYYY format
      const convertDateFormat = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        try {
          // Parse the date - backend might send YYYY-MM-DD or ISO format
          const parsed = dayjs(dateStr);
          if (!parsed.isValid()) return null;
          // Return in DD/MM/YYYY format that ItineraryRow expects
          return parsed.format("DD/MM/YYYY");
        } catch {
          return null;
        }
      };

      const convertTimeFormat = (timeStr: string | null | undefined): string | null => {
        if (!timeStr) return null;
        try {
          // Parse time - backend might send HH:mm or HH:mm:ss
          const parsed = dayjs(timeStr, ["HH:mm:ss", "HH:mm"]);
          if (!parsed.isValid()) return null;
          // Return in HH:mm format that ItineraryRow expects
          return parsed.format("HH:mm");
        } catch {
          return null;
        }
      };

      // For LOCAL travel, backend returns startDate/endDate but frontend expects travelDate
      // For DOMESTIC/INTERNATIONAL, backend returns startDate/endDate which is correct
      const isTravelLocal = currentRequest.travelType === "LOCAL";
      
      updateFormState({
        travelType: currentRequest.travelType,
        purpose: currentRequest.purpose,
        destinationCity: currentRequest.destinationCity,
        destinationState: currentRequest.destinationState || "",
        destinationCountry: currentRequest.destinationCountry || "",
        travelMode: currentRequest.travelMode,
        // For LOCAL: use startDate as travelDate, leave startDate/endDate empty
        // For DOMESTIC/INTERNATIONAL: use startDate and endDate as-is
        travelDate: isTravelLocal ? convertDateFormat(currentRequest.startDate) : convertDateFormat(currentRequest.travelDate),
        startHour: convertTimeFormat(currentRequest.startHour),
        endHour: convertTimeFormat(currentRequest.endHour),
        startDate: isTravelLocal ? null : convertDateFormat(currentRequest.startDate),
        endDate: isTravelLocal ? null : convertDateFormat(currentRequest.endDate),
        remarks: currentRequest.remarks || "",
        coTravellerIds: currentRequest.coTravellers?.map(c => c.employeeId) || [],
      });
      // Also populate pending co-travellers for display
      if (currentRequest.coTravellers && currentRequest.coTravellers.length > 0) {
        setPendingCoTravellers(currentRequest.coTravellers);
      }
    }
  }, [currentRequest?.requestId, currentRequest?.status]);

  // Refresh the currently-selected request from BE so newly-uploaded /
  // deleted attachments and any other server-side changes (e.g. derived
  // co-traveller details) appear immediately, WITHOUT closing the screen
  // or navigating back to the list. Calling onActionComplete() here would
  // pop the user back to the list — that's the post-submit / post-approve
  // flow and is wrong for transient operations like attachment upload.
  const refreshCurrentRequest = useCallback(async (handle: string) => {
    try {
      const fresh = await HrmTravelService.getRequestByHandle({ organizationId, handle });
      setSelectedRequest(fresh);
      updateMyRequest(handle, fresh);
    } catch {
      // Non-fatal — list will reconcile on next navigation.
    }
  }, [organizationId]);

  const handleUpload = async (file: File) => {
    let handle = currentRequest?.handle;

    // If no handle, need to save draft first - but only if form is valid
    if (!handle) {
      if (!formValid) {
        message.error("Please fill all required fields before uploading attachments.");
        return;
      }

      // Fetch fresh policy and validate before saving
      try {
        const freshPolicies = await HrmTravelService.getPolicies({ organizationId });
        const freshPolicy = freshPolicies.find(p => p.travelType === formState.travelType) || freshPolicies[0];
        
        // Validate against fresh policy
        const policyError = validateAgainstFreshPolicy(formState, freshPolicy);
        if (policyError) {
          message.error(policyError);
          return;
        }
      } catch (err) {
        message.error("Failed to validate against policy. Please try again.");
        return;
      }

      const saved = await saveDraft(formState, undefined);
      if (!saved) {
        message.error("Failed to save draft. Please try again.");
        return;
      }
      handle = saved.handle;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1]; // Remove data:image/png;base64, prefix

            // Check for duplicate file names and add suffix if needed
            const currentAttachments = formState.attachmentRefs || [];
            const existingNames = new Set<string>();
            
            // Collect existing file names from both server and pending attachments
            currentRequest?.attachments?.forEach((att) => {
              existingNames.add(att.fileName);
            });
            currentAttachments.forEach((att: any) => {
              existingNames.add(att.fileName);
            });

            // Generate unique file name if duplicate exists
            let uniqueFileName = file.name;
            if (existingNames.has(file.name)) {
              const nameParts = file.name.split('.');
              const extension = nameParts.length > 1 ? '.' + nameParts.pop() : '';
              const baseName = nameParts.join('.');
              
              let counter = 1;
              while (existingNames.has(`${baseName}_${counter}${extension}`)) {
                counter++;
              }
              uniqueFileName = `${baseName}_${counter}${extension}`;
            }

            // Create attachment object with base64
            const attachment = {
              fileName: uniqueFileName,
              base64: base64Data,
              fileSize: file.size,
              fileType: file.type,
            };

            // Add to form state attachments
            updateFormState({
              attachmentRefs: [...currentAttachments, attachment as any],
            });

            message.success("Attachment added. Save draft to persist.");
            resolve();
          } catch (err) {
            const detail = err instanceof Error ? err.message : "";
            message.error(
              detail
                ? `Failed to add attachment: ${detail}`
                : "Failed to upload attachment.",
            );
            reject(err);
          }
        };
        reader.onerror = () => {
          message.error("Failed to read file.");
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
      } catch (err) {
        const detail = err instanceof Error ? err.message : "";
        message.error(
          detail
            ? `Failed to add attachment: ${detail}`
            : "Failed to upload attachment.",
        );
        reject(err);
      }
    });
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    // Check if this is a pending attachment (not yet saved to server)
    if (attachmentId.startsWith("pending-")) {
      // Extract the index from pending-0, pending-1, etc.
      const pendingIndex = parseInt(attachmentId.replace("pending-", ""), 10);
      const currentAttachments = formState.attachmentRefs || [];
      // Remove from form state without calling API
      updateFormState({
        attachmentRefs: currentAttachments.filter((_, idx) => idx !== pendingIndex),
      });
      message.success("Attachment removed.");
      return;
    }

    // For server attachments, mark for deletion locally without calling API
    // When draft is saved, deleted attachments will be excluded from the payload
    const deletedIds = formState.deletedAttachmentIds || [];
    if (!deletedIds.includes(attachmentId)) {
      updateFormState({
        deletedAttachmentIds: [...deletedIds, attachmentId],
      });
    }
    message.success("Attachment marked for deletion. Save draft to confirm.");
  };

  const handleAttachmentPreview = async (att: { attachmentId: string }): Promise<Blob> => {
    if (!currentRequest?.handle) throw new Error("No request handle");
    return HrmTravelService.downloadAttachment({
      organizationId,
      handle: currentRequest.handle,
      attachmentId: att.attachmentId,
    });
  };

  // Travel Advance handlers
  const handleApproveAdvance = async (approve: boolean) => {
    if (!advance?.handle) return;
    setAdvanceLoading(true);
    try {
      if (approve) {
        const result = await HrmTravelService.approveAdvance({
          organizationId,
          handle: advance.handle,
          approvedBy: actorId,
          remarks: advanceApprovalRemarks || undefined,
        });
        setAdvance(result);
        message.success("Travel advance approved.");
      }
      setApproveAdvanceModal(false);
      setAdvanceApprovalRemarks("");
    } catch {
      message.error("Failed to update advance status.");
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleSettleAdvance = async () => {
    if (!advance?.handle || !settleExpenseHandle.trim()) return;
    setAdvanceLoading(true);
    try {
      const result = await HrmTravelService.settleAdvance({
        organizationId,
        handle: advance.handle,
        expenseHandle: settleExpenseHandle.trim(),
        settledBy: actorId,
      });
      setAdvance(result);
      setSettleAdvanceModal(false);
      setSettleExpenseHandle("");
      message.success("Advance settled against expense.");
    } catch {
      message.error("Failed to settle advance.");
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleRequestAdvance = async () => {
    if (!currentRequest?.handle || !advanceAmount) return;
    setAdvanceLoading(true);
    try {
      // Create the advance
      const result = await HrmTravelService.requestAdvance({ 
        organizationId,
        travelHandle: request.handle,
        employeeId: actorId,
        amount: advanceAmount,
        currency: advanceCurrency,
        purpose: request.purpose,
        requestedBy: actorId,
      });
      
      message.success("Travel advance requested successfully.");
      setAdvance(result);
      setAdvanceModalOpen(false);
      setAdvanceAmount(null);
    } catch (err) {
      // Extract detailed error message from backend response
      // The API interceptor already extracts message_details.msg and puts it on err.message
      let errorMessage = "Failed to request advance.";
      
      if (err instanceof Error) {
        // First priority: use the error message (already extracted by API interceptor)
        if (err.message) {
          errorMessage = err.message;
        }
        
        // Second priority: check for error code mapping
        const errorCode = (err as any).errorCode;
        if (errorCode === "ADVANCE_PENDING_EXISTS") {
          errorMessage = "Employee has an existing pending/approved advance that must be settled first.";
        }
      }
      
      message.error(errorMessage);
    } finally {
      setAdvanceLoading(false);
    }
  };

  const barTitle = currentRequest?.requestId
    ? `${currentRequest.requestId} — ${currentRequest.purpose}`
    : isNew
    ? "New Travel Request"
    : "Travel Request";

  const barActions = isReadonly ? (
    <Space>
      {canRecall && (
        <Can I="edit" object="travel_request">
          <Button onClick={() => setRecallModal(true)}>
            Recall
          </Button>
        </Can>
      )}
      {canCancel && (
        <Can I="delete" object="travel_request">
          <Button danger onClick={() => setCancelModal(true)}>
            Cancel Request
          </Button>
        </Can>
      )}
      {canDelete && (
        <Can I="delete" object="travel_request">
          <Button danger onClick={() => setDeleteModal(true)}>
            Delete
          </Button>
        </Can>
      )}
      {currentRequest?.status === "DRAFT" && (
        <Can I="edit" object="travel_request">
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={saving}
            disabled={!isReadonly && !formValid}
            title={!isReadonly && !formValid ? "Please fix validation errors before submitting" : ""}
          >
            Submit
          </Button>
        </Can>
      )}
    </Space>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {showValidationErrors && !formValid && Object.keys(formErrors).length > 0 && (
        <div style={{
          padding: "12px 16px",
          background: "linear-gradient(135deg, #fff2f0 0%, #ffe7e0 100%)",
          border: "2px solid #ff7875",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#d4380d",
          boxShadow: "0 2px 8px rgba(255, 77, 79, 0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ fontSize: "16px", marginTop: "2px" }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>
                Please fix the following errors:
              </strong>
              <ul style={{ 
                margin: "0", 
                paddingLeft: "20px",
                listStyle: "none"
              }}>
                {Object.entries(formErrors).map(([field, error]) => (
                  error && (
                    <li key={field} style={{
                      marginBottom: "6px",
                      borderLeft: "3px solid #ff7875",
                      paddingLeft: "12px"
                    }}>
                      {error}
                    </li>
                  )
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <Space>
        <Can I={isNew ? "add" : "edit"} object="travel_request">
          <Button 
            icon={<SaveOutlined />} 
            onClick={handleSaveDraft} 
            loading={saving} 
            disabled={!formValid}
            title={!formValid ? "Please fill all required fields" : ""}
          >
            Save Draft
          </Button>
        </Can>
        <Can I={isNew ? "add" : "edit"} object="travel_request">
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={saving}
            disabled={!formValid}
            title={!formValid ? "Please fix validation errors before submitting" : ""}
          >
            Submit
          </Button>
        </Can>
      </Space>
    </div>
  );

  const coTravellers = isReadonly
    ? currentRequest?.coTravellers ?? []
    : (() => {
        // Build an id → DTO lookup that prefers session-pending entries (most
        // up-to-date conflict flag from the picker) but falls back to the
        // server-saved list for previously-attached travellers on an edited
        // draft. Order is dictated by formState.coTravellerIds so the list
        // mirrors add/remove order rather than fetch order.
        const byId = new Map<string, CoTravellerDto>();
        (currentRequest?.coTravellers ?? []).forEach((t) => byId.set(t.employeeId, t));
        pendingCoTravellers.forEach((t) => byId.set(t.employeeId, t));
        return formState.coTravellerIds
          .map((id) => byId.get(id))
          .filter((t): t is CoTravellerDto => !!t);
      })();

  const tabItems = [
    {
      key: "details",
      label: "Details",
      children: (
        <div className={styles.detailBody}>
          {isReadonly && request ? (
            <div className={styles.sectionCard}>
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Request ID</div>
                  <div className={styles.infoValue}>{request.requestId}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Travel Type</div>
                  <div className={styles.infoValue}>{request.travelType}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Purpose</div>
                  <div className={styles.infoValue}>{request.purpose}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Destination</div>
                  <div className={styles.infoValue}>
                    {[request.destinationCity, request.destinationState, request.destinationCountry]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>Travel Mode</div>
                  <div className={styles.infoValue}>{request.travelMode}</div>
                </div>
                {request.travelType === "LOCAL" ? (
                  <>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Travel Date</div>
                      <div className={styles.infoValue}>{request.startDate ?? request.travelDate ?? "—"}</div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Hours</div>
                      <div className={styles.infoValue}>
                        {request.startHour} – {request.endHour}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Start Date</div>
                      <div className={styles.infoValue}>{request.startDate ?? "—"}</div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>End Date</div>
                      <div className={styles.infoValue}>{request.endDate ?? "—"}</div>
                    </div>
                  </>
                )}
                {request.currentApproverName && (
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Current Approver</div>
                    <div className={styles.infoValue}>{request.currentApproverName}</div>
                  </div>
                )}
                {request.onDutyApplied && (
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>On-Duty</div>
                    <div className={styles.infoValue}>
                      {request.onDutyEntryRef ? (
                        <span>
                          Auto-applied — Ref:{" "}
                          <code style={{ fontSize: 12 }}>{request.onDutyEntryRef}</code>
                        </span>
                      ) : (
                        "Auto-applied on approval"
                      )}
                    </div>
                  </div>
                )}
                {request.submittedAt && (
                  <div className={styles.infoRow}>
                    <div className={styles.infoLabel}>Submitted On</div>
                    <div className={styles.infoValue}>{request.submittedAt}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <TravelRequestForm
              formState={formState}
              onChange={updateFormState}
              readonly={isReadonly}
              errors={formErrors}
            />
          )}
        </div>
      ),
    },
    {
      key: "cotravellers",
      label: `Co-Travellers${currentRequest?.coTravellers?.length ? ` (${currentRequest.coTravellers.length})` : ""}`,
      children: (
        <div className={styles.detailBody}>
          <CoTravellerPanel
            coTravellers={isReadonly ? currentRequest?.coTravellers ?? [] : coTravellers}
            onAdd={handleCoTravellerAdd}
            onRemove={handleCoTravellerRemove}
            readonly={isReadonly}
            error={formErrors.coTravellers}
          />
        </div>
      ),
    },
    {
      key: "attachments",
      label: `Attachments${(currentRequest?.attachments?.length ?? 0) + (formState.attachmentRefs?.length ?? 0) ? ` (${(currentRequest?.attachments?.length ?? 0) + (formState.attachmentRefs?.length ?? 0)})` : ""}`,
      children: (
        <div className={styles.detailBody}>
          <AttachmentsPanel
            attachments={[
              ...(currentRequest?.attachments?.filter((att) => !(formState.deletedAttachmentIds || []).includes(att.attachmentId)) ?? []),
              ...(formState.attachmentRefs?.map((ref: any, idx: number) => ({
                attachmentId: `pending-${idx}`,
                fileName: ref.fileName || "Unnamed",
                fileSizeBytes: ref.fileSize || 0,
                uploadedAt: new Date().toISOString(),
                uploadedBy: "You",
                base64: ref.base64,  // Include base64 for local preview/download
                fileType: ref.fileType,  // Include file type for proper MIME type
              })) ?? []),
            ]}
            readonly={isReadonly}
            onUpload={handleUpload}
            onDelete={handleDeleteAttachment}
            onPreview={handleAttachmentPreview}
            travelType={formState.travelType}
            allowedFileTypes={policies.length > 0 ? policies[0].allowedFileTypes : ["pdf", "jpg", "jpeg", "png"]}
            maxFileSizeMb={policies.length > 0 ? policies[0].maxFileSizeMb : 5}
            maxFileCount={policies.length > 0 ? policies[0].maxFileCount : 5}
          />
        </div>
      ),
    },
  ];

  if (!isNew && request) {
    if (request.approverChainSnapshot && request.approverChainSnapshot.length > 0) {
      tabItems.push({
        key: "chain",
        label: `Approver Chain (${request.approverChainSnapshot.length})`,
        children: (
          <div className={styles.detailBody}>
            <ApproverChainPanel
              chain={request.approverChainSnapshot}
              currentApproverId={request.currentApproverId}
            />
          </div>
        ),
      });
    }
    tabItems.push({
      key: "timeline",
      label: "Timeline",
      children: (
        <div className={styles.detailBody}>
          <ApprovalTimeline actions={request.actionHistory} />
        </div>
      ),
    });
  }

  return (
    <div className={styles.screenContainer}>
      <TravelScreenHeader
        title={barTitle}
        subtitle={
          currentRequest?.status ? (
            <Space size={6}>
              <TravelStatusChip status={currentRequest.status} />
              {currentRequest.onDutyApplied && (
                <Tag
                  color="green"
                  title={
                    currentRequest.onDutyEntryRef
                      ? `On-duty entry: ${currentRequest.onDutyEntryRef}`
                      : "On-duty auto-applied"
                  }
                >
                  On Duty
                </Tag>
              )}
              {currentRequest.escalationLevel > 0 && (
                <Tag
                  color="volcano"
                  title={
                    currentRequest.escalationDueDate
                      ? `Escalation L${currentRequest.escalationLevel} — due ${currentRequest.escalationDueDate}`
                      : `Escalation level ${currentRequest.escalationLevel}`
                  }
                >
                  Escalated L{currentRequest.escalationLevel}
                </Tag>
              )}
            </Space>
          ) : undefined
        }
        onBack={onBack}
        actions={barActions}
      />

      {isApprover && currentRequest && (
        <Can I="edit" object="travel_approval">
          <ApprovalActionBar
            requestId={currentRequest.requestId}
            loading={approving}
            actorRole={
              // Pull the role from the matching chain entry so the card
              // title reflects the actual approval level (peer / HR /
              // next-superior) instead of always saying "Supervisor".
              request.approverChainSnapshot?.find(
                (e) => e.approverId === request.currentApproverId,
              )?.approverRole
            }
            onApprove={(remarks) => approveRequest(request.handle, remarks).then(onActionComplete)}
            onReject={(remarks) => rejectRequest(request.handle, remarks).then(onActionComplete)}
          />
        </Can>
      )}

      <Tabs
        activeKey={activeDetailTab}
        onChange={(k) => setActiveDetailTab(k as typeof activeDetailTab)}
        style={{ flex: 1 }}
        tabBarStyle={{ padding: "0 16px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}
        items={tabItems}
      />

      {/* Cancel Modal */}
      <Modal
        title="Cancel Request"
        open={cancelModal}
        onCancel={() => setCancelModal(false)}
        onOk={() => {
          cancelRequest(request!.handle, cancelReason).then(() => {
            setCancelModal(false);
            setCancelReason("");
            onActionComplete();
          });
        }}
        okText="Confirm Cancel"
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
      >
        <Input.TextArea
          placeholder="Reason for cancellation (required)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* Recall Modal */}
      <Modal
        title="Recall to Draft"
        open={recallModal}
        onCancel={() => setRecallModal(false)}
        onOk={() => {
          recallRequest(currentRequest!.handle, "").then(() => {
            setRecallModal(false);
            onActionComplete();
          });
        }}
        okText="Confirm Recall"
      >
        <Text>Are you sure you want to recall this request to draft?</Text>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title="Delete Request"
        open={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onOk={() => {
          deleteRequest(request!.handle).then(() => {
            setDeleteModal(false);
            onActionComplete();
          });
        }}
        okText="Delete"
        // okButtonProps={{ danger: true }}
      >
        <Text>Are you sure you want to delete this draft request? This cannot be undone.</Text>
      </Modal>
    </div>
  );
};

export default HrmTravelScreen;
