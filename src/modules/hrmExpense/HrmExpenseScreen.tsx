"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Tabs, Button, Descriptions, Modal, Input, Space, Typography } from "antd";
import { SaveOutlined, SendOutlined, DeleteOutlined, StopOutlined } from "@ant-design/icons";
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
import type { ExpenseReport } from "./types/domain.types";
import type { ExpenseDetailTab } from "./types/ui.types";
import { CANCELLABLE_STATUSES } from "./utils/expenseConstants";
import { isExpenseFormValid } from "./utils/expenseValidations";
import { HrmExpenseService } from "./services/hrmExpenseService";
import styles from "./styles/Expense.module.css";

const { Text } = Typography;

interface Props {
  expense: ExpenseReport | null;
  mode: "create" | "view" | "edit";
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
  const site = cookies.site ?? "";

  const {
    formState,
    updateFormState,
    activeDetailTab,
    setActiveDetailTab,
    approving,
    saving,
    categories,
    mileageConfig,
    financePanel,
    updateFinancePanel,
  } = useHrmExpenseStore();

  const {
    saveDraft,
    submitExpense,
    supervisorApprove,
    supervisorReject,
    financeSanction,
    financeReject,
    markAsPaid,
    cancelExpense,
    deleteExpense,
  } = useExpenseMutations();

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [bankDetails, setBankDetails] = useState<import("./types/domain.types").EmployeeBankDetails | null>(null);

  const isReadonly = mode === "view";
  const isNew = mode === "create";
  const canCancel = expense && CANCELLABLE_STATUSES.includes(expense.status);
  const canDelete = expense && expense.status === "DRAFT";
  const formValid = isExpenseFormValid(formState);

  useEffect(() => {
    if (isFinance && expense?.employeeId) {
      HrmExpenseService.getEmployeeBankDetails({ site, employeeId: expense.employeeId })
        .then(setBankDetails)
        .catch(() => setBankDetails(null));
    }
  }, [isFinance, expense?.employeeId, site]);

  const handleSaveDraft = useCallback(async () => {
    await saveDraft(formState, expense?.handle);
  }, [formState, expense?.handle]);

  const handleSubmit = useCallback(async () => {
    let handle = expense?.handle;
    if (!handle) {
      const saved = await saveDraft(formState, undefined);
      if (!saved) return;
      handle = saved.handle;
    }
    await submitExpense(handle);
    onActionComplete();
  }, [formState, expense?.handle]);

  const handleAddLineItem = async (item: Omit<import("./types/domain.types").ExpenseLineItem, "lineItemId" | "amountInr">) => {
    if (!expense?.handle) return;
    await HrmExpenseService.addLineItem({
      site,
      handle: expense.handle,
      expenseDate: item.expenseDate,
      categoryCode: item.categoryCode,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
    });
    onActionComplete();
  };

  const handleRemoveLineItem = async (lineItemId: string) => {
    if (!expense?.handle) return;
    await HrmExpenseService.removeLineItem({ site, handle: expense.handle, lineItemId });
    onActionComplete();
  };

  const handleAddMileageItem = async (item: Omit<import("./types/domain.types").MileageLineItem, "lineItemId">) => {
    if (!expense?.handle) return;
    await HrmExpenseService.addMileageItem({ site, handle: expense.handle, ...item });
    onActionComplete();
  };

  const handleRemoveMileageItem = async (lineItemId: string) => {
    if (!expense?.handle) return;
    await HrmExpenseService.removeMileageItem({ site, handle: expense.handle, lineItemId });
    onActionComplete();
  };

  const handleUploadAttachment = async (file: File) => {
    if (!expense?.handle) return;
    await HrmExpenseService.uploadAttachment(expense.handle, file, site);
    onActionComplete();
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!expense?.handle) return;
    await HrmExpenseService.deleteAttachment({ site, handle: expense.handle, attachmentId });
    onActionComplete();
  };

  const barTitle = isNew
    ? "New Expense Report"
    : expense
    ? `${expense.reportId} — ${expense.purpose}`
    : "Expense Report";

  const barActions = isReadonly ? (
    <Space>
      {canCancel && (
        <Button danger icon={<StopOutlined />} onClick={() => setCancelModal(true)}>
          Cancel
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

  const lineItemsTab =
    expense?.expenseType === "MILEAGE" ? (
      <div className={styles.detailBody}>
        <MileageLineItemsTable
          mileageItems={expense?.mileageItems ?? []}
          ratePerKm={mileageConfig?.ratePerKm}
          readonly={isReadonly}
          onAddItem={handleAddMileageItem}
          onRemoveItem={handleRemoveMileageItem}
        />
      </div>
    ) : (
      <div className={styles.detailBody}>
        <ExpenseLineItemsTable
          lineItems={expense?.lineItems ?? []}
          categories={categories}
          readonly={isReadonly}
          outOfPolicy={expense?.outOfPolicy}
          justification={formState.outOfPolicyJustification}
          onJustificationChange={(v) => updateFormState({ outOfPolicyJustification: v })}
          onAddItem={handleAddLineItem as never}
          onRemoveItem={handleRemoveLineItem}
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
              <Descriptions.Item label="Report ID">{expense.reportId}</Descriptions.Item>
              <Descriptions.Item label="Expense Type">{expense.expenseType}</Descriptions.Item>
              <Descriptions.Item label="Purpose">{expense.purpose}</Descriptions.Item>
              {expense.travelRefId && (
                <Descriptions.Item label="Travel Reference">
                  {expense.travelRefId}{expense.travelRefSummary ? ` (${expense.travelRefSummary})` : ""}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Date Range">
                {expense.fromDate} – {expense.toDate}
              </Descriptions.Item>
              <Descriptions.Item label="Cost Center">{expense.costCenter}</Descriptions.Item>
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
              {expense.paymentReference && (
                <Descriptions.Item label="Payment Reference">{expense.paymentReference}</Descriptions.Item>
              )}
              {expense.paymentDate && (
                <Descriptions.Item label="Payment Date">{expense.paymentDate}</Descriptions.Item>
              )}
              <Descriptions.Item label="Originals Received">
                {expense.originalsReceived ? "Yes" : "No"}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <ExpenseHeaderForm formState={formState} onChange={updateFormState} readonly={isReadonly} />
          )}
        </div>
      ),
    },
    {
      key: "lineitems",
      label: `Line Items${expense?.lineItems?.length || expense?.mileageItems?.length
        ? ` (${(expense?.lineItems?.length ?? 0) + (expense?.mileageItems?.length ?? 0)})`
        : ""}`,
      children: lineItemsTab,
    },
    {
      key: "attachments",
      label: `Attachments${expense?.attachments?.length ? ` (${expense.attachments.length})` : ""}`,
      children: (
        <div className={styles.detailBody}>
          <ExpenseAttachmentsPanel
            attachments={expense?.attachments ?? []}
            readonly={isReadonly}
            isFinance={isFinance}
            originalsReceived={isFinance ? financePanel.originalsReceived : expense?.originalsReceived}
            onOriginalsChange={(v) => updateFinancePanel({ originalsReceived: v })}
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
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
          <ExpenseApprovalTimeline actions={expense.actionHistory} />
        </div>
      ),
    });
  }

  return (
    <div className={styles.screenContainer}>
      <ExpenseScreenHeader
        title={barTitle}
        onBack={onBack}
        extra={expense?.status ? <ExpenseStatusChip status={expense.status} /> : undefined}
        actions={barActions}
      />

      {isApprover && expense && (
        <SupervisorApprovalBar
          reportId={expense.reportId}
          loading={approving}
          onApprove={(remarks) => supervisorApprove(expense.handle, remarks).then(onActionComplete)}
          onReject={(remarks) => supervisorReject(expense.handle, remarks).then(onActionComplete)}
        />
      )}

      {isFinance && expense && (
        <FinanceApprovalPanel
          reportId={expense.reportId}
          totalClaimedInr={expense.totalClaimedInr}
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
