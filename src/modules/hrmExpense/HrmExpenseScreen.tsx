"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Tabs, Button, Descriptions, Modal, Input, Space, Typography, Tag, Tooltip, Alert, message } from "antd";
import { SaveOutlined, SendOutlined, DeleteOutlined, StopOutlined, RollbackOutlined, CheckSquareOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import { useHrmExpenseStore } from "./stores/hrmExpenseStore";
import { useExpenseMutations } from "./hooks/useExpenseMutations";
import ExpenseHeaderForm from "./components/organisms/ExpenseHeaderForm";
import ExpenseLineItemsTable from "./components/organisms/ExpenseLineItemsTable";
import MileageLineItemsTable from "./components/organisms/MileageLineItemsTable";
import ExpenseAttachmentsPanel from "./components/organisms/ExpenseAttachmentsPanel";
import ExpenseApprovalTimeline from "./components/organisms/ExpenseApprovalTimeline";
import SupervisorApprovalBar from "./components/molecules/SupervisorApprovalBar";
import FinanceApprovalPanel from "./components/organisms/FinanceApprovalPanel";
import ExpenseStatusChip from "./components/atoms/ExpenseStatusChip";
import ExpenseScreenHeader from "./components/organisms/ExpenseScreenHeader";
import Can from "../hrmAccess/components/Can";
import type { ExpenseReport } from "./types/domain.types";
import type { ExpenseDetailTab } from "./types/ui.types";
import { CANCELLABLE_STATUSES, RECALLABLE_STATUSES } from "./utils/expenseConstants";
import {
  isExpenseFormValid,
  validateExpenseForm,
  validateLineItems,
} from "./utils/expenseValidations";
import { HrmExpenseService } from "./services/hrmExpenseService";
import styles from "./styles/Expense.module.css";

const { Text } = Typography;

interface Props {
  expense: ExpenseReport | null;
  mode: "create" | "view";
  isApprover?: boolean;
  isFinance?: boolean;
  onBack: () => void;
  onActionComplete: () => void;
}

const HrmExpenseScreen: React.FC<Props> = ({
  expense,
  mode,
  isApprover,
  isFinance,
  onBack,
  onActionComplete,
}) => {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();

  const {
    formState,
    updateFormState,
    activeDetailTab,
    setActiveDetailTab,
    approving,
    saving,
    submitting,
    categories,
    mileageConfig,
    financePanel,
    updateFinancePanel,
    draftItems,
    addDraftItem,
    removeDraftItem,
  } = useHrmExpenseStore();

  const {
    saveDraft,
    submitExpense,
    supervisorApprove,
    supervisorReject,
    financeSanction,
    financeReject,
    markAsPaid,
    markOriginalsReceived,
    cancelExpense,
    recallExpense,
    deleteExpense,
  } = useExpenseMutations();

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [recallModal, setRecallModal] = useState(false);
  const [recallReason, setRecallReason] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<import("./types/domain.types").EmployeeBankDetails | null>(null);

  const isReadonly = mode === "view";
  const isNew = mode === "create";
  const canCancel = expense && CANCELLABLE_STATUSES.includes(expense.status);
  const canRecall = expense && RECALLABLE_STATUSES.includes(expense.status);
  const canDelete = expense && expense.status === "DRAFT";
  const canMarkOriginals =
    isFinance &&
    expense &&
    !expense.originalsReceived &&
    ["APPROVED", "PAID"].includes(expense.status);
  const validationItems = isReadonly ? expense?.items ?? [] : draftItems;
  const formErrors = isReadonly ? {} : validateExpenseForm(formState, validationItems);
  const lineErrors = isReadonly
    ? []
    : validateLineItems(validationItems, {
        categories,
        fromDate: formState.fromDate,
        toDate: formState.toDate,
      });
  const formValid = isExpenseFormValid(formState, validationItems, categories);

  useEffect(() => {
    if (isFinance && expense?.employeeId) {
      HrmExpenseService.getEmployeeBankDetails({ organizationId, employeeId: expense.employeeId })
        .then(setBankDetails)
        .catch(() => setBankDetails(null));
    }
  }, [isFinance, expense?.employeeId, organizationId]);

  const handleSaveDraft = useCallback(async () => {
    if (!formState.expenseType) {
      message.error("Please select an expense type.");
      return;
    }
    if (!formState.purpose?.trim()) {
      message.error("Please enter a purpose.");
      return;
    }
    await saveDraft(formState, expense?.handle);
  }, [formState, expense?.handle, saveDraft]);

  const handleSubmit = useCallback(async () => {
    if (!formState.fromDate || !formState.toDate) {
      message.error("Please select From Date and To Date before submitting.");
      return;
    }
    if (!formState.purpose?.trim()) {
      message.error("Please enter a purpose before submitting.");
      return;
    }
    const itemsCount = draftItems.length || expense?.items?.length || 0;
    if (itemsCount === 0) {
      message.error("Please add at least one expense line item before submitting.");
      setActiveDetailTab("lineitems");
      return;
    }

    let handle = expense?.handle;
    if (!handle) {
      const saved = await saveDraft(formState, undefined);
      if (!saved) return;
      handle = saved.handle;
    }
    await submitExpense(handle);
    onActionComplete();
  }, [formState, expense?.handle, expense?.items?.length, draftItems.length, saveDraft, submitExpense, setActiveDetailTab, onActionComplete]);

  const handleUploadAttachment = async (file: File) => {
    let handle = expense?.handle;
    if (!handle) {
      // Auto-save draft so the attachment has a parent expense to bind to.
      const saved = await saveDraft(formState, undefined);
      if (!saved) {
        message.warning("Could not save draft. Please save manually before uploading attachments.");
        return;
      }
      handle = saved.handle;
    }
    try {
      await HrmExpenseService.uploadAttachment(handle, file, organizationId);
      message.success("Attachment uploaded.");
      onActionComplete();
    } catch {
      message.error("Failed to upload attachment.");
    }
  };

  const handleUploadLineReceipt = async (lineIndex: number, file: File) => {
    if (!expense?.handle) {
      message.info("Please save the expense as a draft first to upload line receipts.");
      return;
    }
    try {
      await HrmExpenseService.uploadAttachment(expense.handle, file, organizationId, lineIndex);
      message.success("Receipt uploaded.");
      onActionComplete();
    } catch {
      message.error("Failed to upload receipt.");
    }
  };

  const barTitle = isNew
    ? "New Expense Report"
    : expense
    ? `${expense.requestId} — ${expense.purpose}`
    : "Expense Report";

  const barActions = isReadonly ? (
    <Space>
      {canMarkOriginals && (
        <Can I="edit">
          <Button
            type="primary"
            icon={<CheckSquareOutlined />}
            loading={approving}
            onClick={() => markOriginalsReceived(expense!.handle, true).then(onActionComplete)}
          >
            Mark Originals Received
          </Button>
        </Can>
      )}
      {canRecall && (
        <Can I="edit">
          <Button icon={<RollbackOutlined />} onClick={() => setRecallModal(true)}>
            Recall
          </Button>
        </Can>
      )}
      {canCancel && (
        <Can I="delete">
          <Button danger icon={<StopOutlined />} onClick={() => setCancelModal(true)}>
            Cancel
          </Button>
        </Can>
      )}
      {canDelete && (
        <Can I="delete">
          <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteModal(true)}>
            Delete
          </Button>
        </Can>
      )}
    </Space>
  ) : (
    <Space>
      <Can I={isNew ? "add" : "edit"}>
        <Button
          icon={<SaveOutlined />}
          onClick={handleSaveDraft}
          loading={saving}
          disabled={submitting || approving}
        >
          Save Draft
        </Button>
      </Can>
      <Can I={isNew ? "add" : "edit"}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={saving || approving}
        >
          Submit
        </Button>
      </Can>
    </Space>
  );

  // Items are now a flat array in the response (items), containing both regular and mileage items
  const expenseItems = expense?.items ?? [];
  const workingItems = isReadonly ? expenseItems : draftItems;
  const mileageItems = workingItems.filter((item) => item.distanceKm != null);
  const regularItems = workingItems.filter((item) => item.distanceKm == null);
  const draftOutOfPolicy = draftItems.some((item) => item.outOfPolicy);

  const handleAddDraftItem = useCallback(
    (item: Partial<ExpenseReport["items"][number]>) => {
      const handle = `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const mileageCategory =
        categories.find((c) => c.mileageCategory)?.categoryCode || "CAT-MILEAGE";
      addDraftItem({
        handle,
        categoryId: item.categoryId || mileageCategory,
        categoryName: item.categoryName,
        expenseDate: item.expenseDate || formState.fromDate || "",
        description: item.description || "",
        amount: item.amount ?? 0,
        currency: item.currency || formState.currency || "INR",
        fromLocation: item.fromLocation,
        toLocation: item.toLocation,
        distanceKm: item.distanceKm,
        ratePerKm: item.ratePerKm,
        mileageAmount: item.mileageAmount,
        attachmentRef: item.attachmentRef,
        outOfPolicy: item.outOfPolicy ?? false,
      });
    },
    [addDraftItem, categories, formState.currency, formState.fromDate]
  );

  const handleRemoveDraftItem = useCallback(
    (handle: string) => {
      removeDraftItem(handle);
    },
    [removeDraftItem]
  );

  const lineItemsTab =
    expense?.expenseType === "MILEAGE" ? (
      <div className={styles.detailBody}>
        <MileageLineItemsTable
          mileageItems={mileageItems}
          ratePerKm={mileageConfig?.ratePerKm}
          readonly={isReadonly}
          onAddItem={handleAddDraftItem}
          onRemoveItem={handleRemoveDraftItem}
        />
      </div>
    ) : (
      <div className={styles.detailBody}>
        <ExpenseLineItemsTable
          lineItems={regularItems}
          categories={categories}
          readonly={isReadonly}
          outOfPolicy={isReadonly ? expense?.outOfPolicy : draftOutOfPolicy}
          justification={formState.outOfPolicyJustification}
          justificationError={formErrors.outOfPolicyJustification}
          lineErrors={lineErrors}
          onJustificationChange={(v) => updateFormState({ outOfPolicyJustification: v })}
          onAddItem={handleAddDraftItem}
          onRemoveItem={handleRemoveDraftItem}
          onUploadReceipt={expense?.handle ? handleUploadLineReceipt : undefined}
        />
      </div>
    );

  const tabItems = [
    {
      key: "header",
      label: "Header",
      children: (
        <div className={styles.detailBody}>
          {isReadonly && expense ? (
            <Descriptions bordered column={1} size="small" labelStyle={{ width: 160, background: "#fafafa" }}>
              <Descriptions.Item label="Report ID">{expense.requestId}</Descriptions.Item>
              <Descriptions.Item label="Expense Type">{expense.expenseType}</Descriptions.Item>
              <Descriptions.Item label="Purpose">{expense.purpose}</Descriptions.Item>
              {expense.travelRequestId && (
                <Descriptions.Item label="Travel Reference">
                  {expense.travelRequestId}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Date Range">
                {expense.items?.[0]?.expenseDate ?? "—"} – {expense.items?.[expense.items.length - 1]?.expenseDate ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Cost Center">{expense.costCenter}</Descriptions.Item>
              {expense.projectCode && (
                <Descriptions.Item label="Project Code">{expense.projectCode}</Descriptions.Item>
              )}
              {expense.wbsCode && (
                <Descriptions.Item label="WBS Code">{expense.wbsCode}</Descriptions.Item>
              )}
              <Descriptions.Item label="Currency">
                {expense.currency} (Rate: {expense.exchangeRate})
              </Descriptions.Item>
              <Descriptions.Item label="Total Claimed">
                {expense.currency} {expense.totalClaimedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Descriptions.Item>
              {expense.sanctionedAmount != null && (
                <Descriptions.Item label="Sanctioned Amount">
                  INR {expense.sanctionedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Descriptions.Item>
              )}
              {expense.perDiemAmount != null && (
                <Descriptions.Item label="Per Diem">
                  INR {expense.perDiemAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Descriptions.Item>
              )}
              {expense.paymentReference && (
                <Descriptions.Item label="Payment Reference">{expense.paymentReference}</Descriptions.Item>
              )}
              {expense.paymentMode && (
                <Descriptions.Item label="Payment Mode">{expense.paymentMode}</Descriptions.Item>
              )}
              {expense.paymentDate && (
                <Descriptions.Item label="Payment Date">{expense.paymentDate}</Descriptions.Item>
              )}
              {expense.financeUserName && (
                <Descriptions.Item label="Finance Approver">
                  {expense.financeUserName}
                  {expense.financeUserId ? ` (${expense.financeUserId})` : ""}
                </Descriptions.Item>
              )}
              {expense.originalsReceived != null && (
                <Descriptions.Item label="Originals Received">
                  {expense.originalsReceived ? "Yes" : "No"}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <ExpenseHeaderForm
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
      key: "lineitems",
      label: `Line Items${expenseItems.length ? ` (${expenseItems.length})` : ""}`,
      children: lineItemsTab,
    },
    {
      key: "attachments",
      label: `Attachments${expense?.attachments?.length ? ` (${expense.attachments.length})` : ""}`,
      children: (
        <div className={styles.detailBody}>
          {isNew && (
            <Alert
              type="info"
              showIcon
              message="Save as draft to enable attachment uploads — uploading will auto-save the draft."
              style={{ marginBottom: 12 }}
            />
          )}
          <ExpenseAttachmentsPanel
            attachments={expense?.attachments ?? []}
            readonly={isReadonly}
            isFinance={isFinance}
            originalsReceived={isFinance ? financePanel.originalsReceived : expense?.originalsReceived}
            onOriginalsChange={(v) => updateFinancePanel({ originalsReceived: v })}
            onUpload={handleUploadAttachment}
          />
        </div>
      ),
    },
  ];

  if (!isNew && expense) {
    tabItems.push({
      key: "timeline",
      label: "Timeline",
      children: (
        <div className={styles.detailBody}>
          <ExpenseApprovalTimeline actions={expense.approvalHistory} />
        </div>
      ),
    });
  }

  return (
    <div className={styles.screenContainer}>
      <ExpenseScreenHeader
        title={barTitle}
        onBack={onBack}
        extra={
          expense?.status ? (
            <Space size={8}>
              <ExpenseStatusChip status={expense.status} />
              {expense.lateSubmission && (
                <Tooltip title="Submitted after the policy deadline">
                  <Tag color="red">Late Submission</Tag>
                </Tooltip>
              )}
              {expense.escalationLevel != null && expense.escalationLevel > 0 && (
                <Tooltip
                  title={
                    expense.slaDeadline
                      ? `Escalation L${expense.escalationLevel} — SLA due ${expense.slaDeadline}`
                      : `Escalation level ${expense.escalationLevel}`
                  }
                >
                  <Tag color="volcano">Escalated L{expense.escalationLevel}</Tag>
                </Tooltip>
              )}
            </Space>
          ) : undefined
        }
        actions={barActions}
      />

      {isApprover && expense && (
        <SupervisorApprovalBar
          reportId={expense.requestId}
          loading={approving}
          onApprove={(remarks) => supervisorApprove(expense.handle, remarks).then(onActionComplete)}
          onReject={(remarks) => supervisorReject(expense.handle, remarks).then(onActionComplete)}
        />
      )}

      {isFinance && expense && (
        <FinanceApprovalPanel
          reportId={expense.requestId}
          totalClaimedAmountInr={expense.totalClaimedAmountInr}
          panel={financePanel}
          bankDetails={bankDetails}
          loading={approving}
          onChange={updateFinancePanel}
          onApprove={() => financeSanction(expense.handle, financePanel).then(onActionComplete)}
          onReject={(remarks) => financeReject(expense.handle, remarks).then(onActionComplete)}
          onMarkPaid={() => markAsPaid(expense.handle, financePanel).then(onActionComplete)}
        />
      )}

      <Tabs
        activeKey={activeDetailTab}
        onChange={(k) => setActiveDetailTab(k as ExpenseDetailTab)}
        style={{ flex: 1 }}
        tabBarStyle={{ padding: "0 16px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}
        items={tabItems}
      />

      {/* Cancel Modal */}
      <Modal
        title="Cancel Expense"
        open={cancelModal}
        onCancel={() => setCancelModal(false)}
        onOk={() => {
          cancelExpense(expense!.handle, cancelReason).then(() => {
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
        title="Recall Expense Report"
        open={recallModal}
        onCancel={() => setRecallModal(false)}
        onOk={() => {
          recallExpense(expense!.handle, recallReason).then(() => {
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
        title="Delete Expense"
        open={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onOk={() => {
          deleteExpense(expense!.handle).then(() => {
            setDeleteModal(false);
            onActionComplete();
          });
        }}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <Text>Are you sure you want to delete this draft? This cannot be undone.</Text>
      </Modal>
    </div>
  );
};

export default HrmExpenseScreen;
