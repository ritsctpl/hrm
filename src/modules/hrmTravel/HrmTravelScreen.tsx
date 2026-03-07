"use client";

import React, { useCallback, useState } from "react";
import { Tabs, Button, Descriptions, Modal, Input, Space, Typography } from "antd";
import {
  SaveOutlined,
  SendOutlined,
  RollbackOutlined,
  DeleteOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { parseCookies } from "nookies";
import TravelScreenHeader from "./components/organisms/TravelScreenHeader";
import { useHrmTravelStore } from "./stores/hrmTravelStore";
import { useTravelMutations } from "./hooks/useTravelMutations";
import TravelRequestForm from "./components/organisms/TravelRequestForm";
import CoTravellerPanel from "./components/organisms/CoTravellerPanel";
import AttachmentsPanel from "./components/organisms/AttachmentsPanel";
import ApprovalTimeline from "./components/organisms/ApprovalTimeline";
import ApprovalActionBar from "./components/molecules/ApprovalActionBar";
import TravelStatusChip from "./components/atoms/TravelStatusChip";
import type { TravelRequest } from "./types/domain.types";
import type { CoTravellerDto } from "./types/domain.types";
import { CANCELLABLE_STATUSES, RECALLABLE_STATUSES } from "./utils/travelConstants";
import { isTravelFormValid } from "./utils/travelValidations";
import { HrmTravelService } from "./services/hrmTravelService";
import styles from "./styles/Travel.module.css";

const { Text } = Typography;

interface Props {
  request: TravelRequest | null;
  mode: "create" | "view" | "edit";
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
  const site = cookies.site ?? "";

  const { formState, updateFormState, activeDetailTab, setActiveDetailTab, approving, saving } =
    useHrmTravelStore();

  const { saveDraft, submitRequest, approveRequest, rejectRequest, cancelRequest, recallRequest, deleteRequest } =
    useTravelMutations();

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [recallModal, setRecallModal] = useState(false);
  const [recallReason, setRecallReason] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);

  const isReadonly = mode === "view";
  const isNew = mode === "create";
  const canCancel = request && CANCELLABLE_STATUSES.includes(request.status);
  const canRecall = request && RECALLABLE_STATUSES.includes(request.status);
  const canDelete = request && request.status === "DRAFT";
  const formValid = isTravelFormValid(formState);

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
    if (!request?.handle) return;
    await HrmTravelService.uploadAttachment(request.handle, file, site);
    onActionComplete();
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!request?.handle) return;
    await HrmTravelService.deleteAttachment({ site, handle: request.handle, attachmentId });
    onActionComplete();
  };

  const barTitle = isNew
    ? "New Travel Request"
    : request
    ? `${request.requestId} — ${request.purpose}`
    : "Travel Request";

  const barActions = isReadonly ? (
    <Space>
      {canRecall && (
        <Button icon={<RollbackOutlined />} onClick={() => setRecallModal(true)}>
          Recall
        </Button>
      )}
      {canCancel && (
        <Button danger icon={<StopOutlined />} onClick={() => setCancelModal(true)}>
          Cancel Request
        </Button>
      )}
      {canDelete && (
        <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteModal(true)}>
          Delete
        </Button>
      )}
    </Space>
  ) : (
    <Space>
      <Button icon={<SaveOutlined />} onClick={handleSaveDraft} loading={saving} disabled={!formValid}>
        Save Draft
      </Button>
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSubmit}
        loading={saving}
        disabled={!formValid}
      >
        Submit
      </Button>
    </Space>
  );

  const coTravellers = isReadonly
    ? request?.coTravellers ?? []
    : (request?.coTravellers?.filter((t) =>
        formState.coTravellerIds.includes(t.employeeId)
      ) ?? []);

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
              {request.submittedAt && (
                <Descriptions.Item label="Submitted On">{request.submittedAt}</Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <TravelRequestForm formState={formState} onChange={updateFormState} readonly={isReadonly} />
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
        extra={request?.status ? <TravelStatusChip status={request.status} /> : undefined}
        actions={barActions}
      />

      {isApprover && request && (
        <ApprovalActionBar
          requestId={request.requestId}
          loading={approving}
          onApprove={(remarks) => approveRequest(request.handle, remarks).then(onActionComplete)}
          onReject={(remarks) => rejectRequest(request.handle, remarks).then(onActionComplete)}
        />
      )}

      <Tabs
        activeKey={activeDetailTab}
        onChange={(k) => setActiveDetailTab(k as typeof activeDetailTab)}
        style={{ flex: 1 }}
        tabBarStyle={{ padding: "0 16px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}
        items={tabItems}
      />

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
    </div>
  );
};

export default HrmTravelScreen;
