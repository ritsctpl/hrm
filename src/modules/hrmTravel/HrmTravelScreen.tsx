"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Tabs, Button, Descriptions, Modal, Input, Space, Typography, Card, InputNumber, Select, Tag, message } from "antd";
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
import { parseCookies } from "nookies";
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
import { isTravelFormValid, validateTravelForm } from "./utils/travelValidations";
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
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const employeeId = cookies.employeeId ?? cookies.userId ?? cookies.user ?? cookies.rl_user_id ?? "";

  const { formState, updateFormState, activeDetailTab, setActiveDetailTab, approving, saving } =
    useHrmTravelStore();

  const { saveDraft, submitRequest, approveRequest, rejectRequest, cancelRequest, recallRequest, deleteRequest } =
    useTravelMutations();

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [recallModal, setRecallModal] = useState(false);
  const [recallReason, setRecallReason] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);

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

  const isReadonly = mode === "view";
  const isNew = mode === "create";
  const canCancel = request && CANCELLABLE_STATUSES.includes(request.status);
  const canRecall = request && RECALLABLE_STATUSES.includes(request.status);
  const canDelete = request && request.status === "DRAFT";
  const validationCtx = {
    coTravellers: request?.coTravellers ?? [],
  };
  const formErrors = isReadonly ? {} : validateTravelForm(formState, validationCtx);
  const formValid = isTravelFormValid(formState, validationCtx);
  const canRequestAdvance = request && request.status === "APPROVED" && !advance;
  // Approver/admin can approve REQUESTED advances; finance/admin can settle APPROVED ones.
  const canApproveAdvance = !!(isApprover && advance && advance.status === "REQUESTED");
  const canSettleAdvance = !!(advance && advance.status === "APPROVED");

  // Load advance on mount for approved requests
  useEffect(() => {
    if (request?.handle && request.status === "APPROVED") {
      HrmTravelService.retrieveAdvance({ organizationId, handle: request.handle })
        .then(setAdvance)
        .catch(() => setAdvance(null));
    }
  }, [request?.handle, request?.status, organizationId]);

  const handleSaveDraft = useCallback(async () => {
    await saveDraft(formState, request?.handle);
  }, [formState, request?.handle]);

  const handleSubmit = useCallback(async () => {
    let handle = request?.handle;
    if (!handle) {
      const saved = await saveDraft(formState, undefined);
      if (!saved) return;
      handle = saved.handle;
    }
    await submitRequest(handle);
    onActionComplete();
  }, [formState, request?.handle]);

  const handleCoTravellerAdd = (traveller: CoTravellerDto) => {
    if (!formState.coTravellerIds.includes(traveller.employeeId)) {
      updateFormState({ coTravellerIds: [...formState.coTravellerIds, traveller.employeeId] });
    }
  };

  const handleCoTravellerRemove = (employeeId: string) => {
    updateFormState({
      coTravellerIds: formState.coTravellerIds.filter((id) => id !== employeeId),
    });
  };

  const handleUpload = async (file: File) => {
    let handle = request?.handle;

    if (!handle) {
      const saved = await saveDraft(formState, undefined);
      if (!saved) {
        message.error("Please save the draft before uploading attachments.");
        return;
      }
      handle = saved.handle;
    }

    try {
      await HrmTravelService.uploadAttachment(handle, file, organizationId);
      onActionComplete();
      message.success("Attachment uploaded.");
    } catch {
      message.error("Failed to upload attachment.");
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!request?.handle) return;
    await HrmTravelService.deleteAttachment({ organizationId, handle: request.handle, attachmentId });
    onActionComplete();
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
          approvedBy: employeeId,
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
        settledBy: employeeId,
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
    if (!request?.handle || !advanceAmount) return;
    setAdvanceLoading(true);
    try {
      const result = await HrmTravelService.requestAdvance({ organizationId,
        travelHandle: request.handle,
        employeeId,
        amount: advanceAmount,
        currency: advanceCurrency,
        purpose: request.purpose,
        requestedBy: employeeId,
      });
      setAdvance(result);
      setAdvanceModalOpen(false);
      setAdvanceAmount(null);
      message.success("Travel advance requested.");
    } catch {
      message.error("Failed to request advance.");
    } finally {
      setAdvanceLoading(false);
    }
  };

  const barTitle = isNew
    ? "New Travel Request"
    : request
    ? `${request.requestId} — ${request.purpose}`
    : "Travel Request";

  const barActions = isReadonly ? (
    <Space>
      {canRecall && (
        <Can I="edit" object="travel_request">
          <Button icon={<RollbackOutlined />} onClick={() => setRecallModal(true)}>
            Recall
          </Button>
        </Can>
      )}
      {canCancel && (
        <Can I="delete" object="travel_request">
          <Button danger icon={<StopOutlined />} onClick={() => setCancelModal(true)}>
            Cancel Request
          </Button>
        </Can>
      )}
      {canDelete && (
        <Can I="delete" object="travel_request">
          <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteModal(true)}>
            Delete
          </Button>
        </Can>
      )}
    </Space>
  ) : (
    <Space>
      <Can I={isNew ? "add" : "edit"} object="travel_request">
        <Button icon={<SaveOutlined />} onClick={handleSaveDraft} loading={saving} disabled={!formValid}>
          Save Draft
        </Button>
      </Can>
      <Can I={isNew ? "add" : "edit"} object="travel_request">
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={saving}
          disabled={!formValid}
        >
          Submit
        </Button>
      </Can>
    </Space>
  );

  const coTravellers = isReadonly
    ? request?.coTravellers ?? []
    : (request?.coTravellers?.filter((t) =>
        formState.coTravellerIds.includes(t.employeeId)
      ) ?? []);

  // Travel Advance section (visible only for APPROVED requests)
  const advanceSection = request?.status === "APPROVED" ? (
    <Card
      size="small"
      title="Travel Advance"
      style={{ margin: "12px 16px 0" }}
      extra={
        <Space>
          {canRequestAdvance && (
            <Can I="add" object="travel_request">
              <Button
                type="primary"
                size="small"
                icon={<DollarOutlined />}
                onClick={() => setAdvanceModalOpen(true)}
              >
                Request Advance
              </Button>
            </Can>
          )}
          {canApproveAdvance && (
            <Can I="edit" object="travel_approval">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => setApproveAdvanceModal(true)}
              >
                Approve Advance
              </Button>
            </Can>
          )}
          {canSettleAdvance && (
            <Can I="edit" object="travel_approval">
              <Button
                size="small"
                icon={<LinkOutlined />}
                onClick={() => setSettleAdvanceModal(true)}
              >
                Settle with Expense
              </Button>
            </Can>
          )}
        </Space>
      }
    >
      {advance ? (
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label="Amount">
            {advance.currency} {advance.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={ADVANCE_STATUS_COLORS[advance.status] ?? "default"}>
              {advance.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Requested">
            {advance.createdDateTime} by {advance.createdBy}
          </Descriptions.Item>
          {advance.approvedBy && (
            <Descriptions.Item label="Approved">
              {advance.approvedAt ?? "—"} by {advance.approvedBy}
            </Descriptions.Item>
          )}
          {advance.rejectedBy && (
            <Descriptions.Item label="Rejected">
              {advance.rejectedAt ?? "—"} by {advance.rejectedBy}
            </Descriptions.Item>
          )}
          {advance.settledBy && (
            <Descriptions.Item label="Settled">
              {advance.settledAt ?? "—"} by {advance.settledBy}
              {advance.expenseHandle ? ` (Expense: ${advance.expenseHandle})` : ""}
            </Descriptions.Item>
          )}
          {advance.approvalRemarks && (
            <Descriptions.Item label="Remarks" span={2}>
              {advance.approvalRemarks}
            </Descriptions.Item>
          )}
          {advance.rejectionRemarks && (
            <Descriptions.Item label="Reject Reason" span={2}>
              {advance.rejectionRemarks}
            </Descriptions.Item>
          )}
        </Descriptions>
      ) : (
        <Text type="secondary">No advance requested yet.</Text>
      )}
    </Card>
  ) : null;

  const tabItems = [
    {
      key: "details",
      label: "Details",
      children: (
        <div className={styles.detailBody}>
          {isReadonly && request ? (
            <Descriptions
              bordered
              column={1}
              size="small"
              labelStyle={{ width: 160, background: "#fafafa" }}
            >
              <Descriptions.Item label="Request ID">{request.requestId}</Descriptions.Item>
              <Descriptions.Item label="Travel Type">{request.travelType}</Descriptions.Item>
              <Descriptions.Item label="Purpose">{request.purpose}</Descriptions.Item>
              <Descriptions.Item label="Destination">
                {[request.destinationCity, request.destinationState, request.destinationCountry]
                  .filter(Boolean)
                  .join(", ")}
              </Descriptions.Item>
              <Descriptions.Item label="Travel Mode">{request.travelMode}</Descriptions.Item>
              {request.travelType === "LOCAL" ? (
                <>
                  <Descriptions.Item label="Travel Date">{request.travelDate ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Hours">
                    {request.startHour} – {request.endHour}
                  </Descriptions.Item>
                </>
              ) : (
                <>
                  <Descriptions.Item label="Start Date">{request.startDate ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="End Date">{request.endDate ?? "—"}</Descriptions.Item>
                </>
              )}
              {request.currentApproverName && (
                <Descriptions.Item label="Current Approver">
                  {request.currentApproverName}
                </Descriptions.Item>
              )}
              {request.onDutyApplied && (
                <Descriptions.Item label="On-Duty">
                  {request.onDutyEntryRef ? (
                    <span>
                      Auto-applied — Ref:{" "}
                      <code style={{ fontSize: 12 }}>{request.onDutyEntryRef}</code>
                    </span>
                  ) : (
                    "Auto-applied on approval"
                  )}
                </Descriptions.Item>
              )}
              {request.submittedAt && (
                <Descriptions.Item label="Submitted On">{request.submittedAt}</Descriptions.Item>
              )}
            </Descriptions>
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
      label: `Co-Travellers${request?.coTravellers?.length ? ` (${request.coTravellers.length})` : ""}`,
      children: (
        <div className={styles.detailBody}>
          <CoTravellerPanel
            coTravellers={isReadonly ? request?.coTravellers ?? [] : coTravellers}
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
      label: `Attachments${request?.attachments?.length ? ` (${request.attachments.length})` : ""}`,
      children: (
        <div className={styles.detailBody}>
          <AttachmentsPanel
            attachments={request?.attachments ?? []}
            readonly={isReadonly}
            onUpload={handleUpload}
            onDelete={handleDeleteAttachment}
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
        onBack={onBack}
        extra={
          request?.status ? (
            <Space size={6}>
              <TravelStatusChip status={request.status} />
              {request.onDutyApplied && (
                <Tag
                  color="green"
                  title={
                    request.onDutyEntryRef
                      ? `On-duty entry: ${request.onDutyEntryRef}`
                      : "On-duty auto-applied"
                  }
                >
                  On Duty
                </Tag>
              )}
              {request.escalationLevel > 0 && (
                <Tag
                  color="volcano"
                  title={
                    request.escalationDueDate
                      ? `Escalation L${request.escalationLevel} — due ${request.escalationDueDate}`
                      : `Escalation level ${request.escalationLevel}`
                  }
                >
                  Escalated L{request.escalationLevel}
                </Tag>
              )}
            </Space>
          ) : undefined
        }
        actions={barActions}
      />

      {isApprover && request && (
        <Can I="edit" object="travel_approval">
          <ApprovalActionBar
            requestId={request.requestId}
            loading={approving}
            onApprove={(remarks) => approveRequest(request.handle, remarks).then(onActionComplete)}
            onReject={(remarks) => rejectRequest(request.handle, remarks).then(onActionComplete)}
          />
        </Can>
      )}

      {advanceSection}

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
          recallRequest(request!.handle, recallReason).then(() => {
            setRecallModal(false);
            setRecallReason("");
            onActionComplete();
          });
        }}
        okText="Confirm Recall"
        okButtonProps={{ disabled: !recallReason.trim() }}
      >
        <Input.TextArea
          placeholder="Reason for recalling (required)"
          value={recallReason}
          onChange={(e) => setRecallReason(e.target.value)}
          rows={3}
        />
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
        okButtonProps={{ danger: true }}
      >
        <Text>Are you sure you want to delete this draft request? This cannot be undone.</Text>
      </Modal>

      {/* Travel Advance Approve Modal */}
      <Modal
        title="Approve Travel Advance"
        open={approveAdvanceModal}
        onCancel={() => setApproveAdvanceModal(false)}
        onOk={() => handleApproveAdvance(true)}
        confirmLoading={advanceLoading}
        okText="Approve"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {advance && (
            <Text type="secondary">
              {advance.currency} {advance.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} for{" "}
              {advance.employeeName}
            </Text>
          )}
          <Input.TextArea
            placeholder="Approval remarks (optional)"
            value={advanceApprovalRemarks}
            onChange={(e) => setAdvanceApprovalRemarks(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* Travel Advance Settle Modal */}
      <Modal
        title="Settle Travel Advance"
        open={settleAdvanceModal}
        onCancel={() => setSettleAdvanceModal(false)}
        onOk={handleSettleAdvance}
        confirmLoading={advanceLoading}
        okText="Settle"
        okButtonProps={{ disabled: !settleExpenseHandle.trim() }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Text type="secondary">
            Link this advance to a settled expense report. Enter the expense handle (UUID) issued by Finance.
          </Text>
          <Input
            placeholder="Expense handle (e.g. 8c1d-…)"
            value={settleExpenseHandle}
            onChange={(e) => setSettleExpenseHandle(e.target.value)}
          />
        </div>
      </Modal>

      {/* Travel Advance Request Modal */}
      <Modal
        title="Request Travel Advance"
        open={advanceModalOpen}
        onCancel={() => setAdvanceModalOpen(false)}
        onOk={handleRequestAdvance}
        confirmLoading={advanceLoading}
        okText="Request"
        okButtonProps={{ disabled: !advanceAmount || advanceAmount <= 0 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <Text strong>Amount *</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 4 }}
              min={1}
              placeholder="Enter advance amount"
              value={advanceAmount}
              onChange={(v) => setAdvanceAmount(v)}
            />
          </div>
          <div>
            <Text strong>Currency</Text>
            <Select
              style={{ width: "100%", marginTop: 4 }}
              value={advanceCurrency}
              onChange={setAdvanceCurrency}
              options={[
                { value: "INR", label: "INR" },
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
                { value: "GBP", label: "GBP" },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HrmTravelScreen;
