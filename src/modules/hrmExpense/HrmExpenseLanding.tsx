"use client";

import React, { useEffect, useCallback, useState } from "react";
import { Alert, Button, Tabs, Typography, Space } from "antd";
import { PlusOutlined, DownloadOutlined, WarningOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import { getOrganizationId } from "@/utils/cookieUtils";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmExpenseStore } from "./stores/hrmExpenseStore";
import { useExpenseData } from "./hooks/useExpenseData";
import { useDebounce } from "./hooks/useDebounce";
import ExpenseSearchBar from "./components/molecules/ExpenseSearchBar";
import ExpenseListTable from "./components/organisms/ExpenseListTable";
import SupervisorInboxTable from "./components/organisms/SupervisorInboxTable";
import ExpenseCategoryConfig from "./components/organisms/ExpenseCategoryConfig";
import ExpenseMasterDetailTemplate from "./components/templates/ExpenseMasterDetailTemplate";
import ExpenseApproverTemplate from "./components/templates/ExpenseApproverTemplate";
import ExpenseScreenHeader from "./components/organisms/ExpenseScreenHeader";
import ExpenseReportScreen from "./components/organisms/ExpenseReportScreen";
import UnsettledAdvancesScreen from "./components/organisms/UnsettledAdvancesScreen";
import HrmExpenseScreen from "./HrmExpenseScreen";
import Can from "../hrmAccess/components/Can";
import ModuleAccessGate from "../hrmAccess/components/ModuleAccessGate";
import { HrmExpenseService } from "./services/hrmExpenseService";
import type { UnsettledAdvance } from "./types/api.types";
import styles from "./styles/Expense.module.css";

const { Text } = Typography;

const SUPERVISOR_ROLES = ["SUPERVISOR", "NEXT_SUPERIOR", "MANAGER"];
const FINANCE_ROLES = ["FINANCE", "FINANCE_ADMIN"];
const ADMIN_ROLES = ["ADMIN", "HR", "SUPERADMIN"];

const HrmExpenseLanding: React.FC = () => {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const role = cookies.userRole ?? "EMPLOYEE";

  const {
    myExpenses,
    listLoading,
    supervisorInbox,
    financeInbox,
    inboxLoading,
    selectedExpense,
    screenMode,
    categories,
    statusFilter,
    typeFilter,
    dateRange,
    searchTerm,
    setSelectedExpense,
    setScreenMode,
    resetFormState,
    resetDraftItems,
  } = useHrmExpenseStore();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [exporting, setExporting] = useState(false);

  const {
    loadMyExpenses,
    loadSupervisorInbox,
    loadFinanceInbox,
    loadCategories,
    loadMileageConfig,
    exportExpenses,
    loadUnsettledAdvances,
  } = useExpenseData();

  const isSupervisor = SUPERVISOR_ROLES.includes(role);
  const isFinance = FINANCE_ROLES.includes(role);
  const isAdmin = ADMIN_ROLES.includes(role);

  const [unsettledAdvances, setUnsettledAdvances] = useState<UnsettledAdvance[]>([]);

  // Load data on mount
  useEffect(() => {
    loadMyExpenses();
    loadCategories();
    loadMileageConfig();
    loadUnsettledAdvances().then(setUnsettledAdvances);
  }, [organizationId]);

  useEffect(() => {
    if (isSupervisor || isAdmin) {
      loadSupervisorInbox();
    }
  }, [organizationId, role]);

  useEffect(() => {
    if (isFinance || isAdmin) {
      loadFinanceInbox();
    }
  }, [organizationId, role]);

  // Auto-trigger search when filters or debounced search term change
  useEffect(() => {
    loadMyExpenses();
  }, [statusFilter, typeFilter, dateRange, debouncedSearchTerm]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportExpenses();
    } finally {
      setExporting(false);
    }
  }, [exportExpenses]);

  const handleNewExpense = () => {
    setSelectedExpense(null);
    resetFormState();
    resetDraftItems();
    setScreenMode("create");
  };

  const handleSettleAdvance = (advance: UnsettledAdvance) => {
    setSelectedExpense(null);
    resetDraftItems();
    resetFormState();
    useHrmExpenseStore.getState().updateFormState({
      expenseType: "REIMBURSEMENT",
      purpose: `Settlement of advance: ${advance.travelPurpose}`,
      linkedAdvanceHandle: advance.handle,
      currency: advance.currency,
    });
    setScreenMode("create");
  };

  const handleRowClick = useCallback((expense: typeof myExpenses[0]) => {
    setSelectedExpense(expense);
    setScreenMode("view");
  }, []);

  const handleBack = () => {
    setScreenMode("list");
    setSelectedExpense(null);
    resetDraftItems();
  };

  const handleActionComplete = () => {
    loadMyExpenses();
    loadUnsettledAdvances().then(setUnsettledAdvances);
    if (isSupervisor || isAdmin) loadSupervisorInbox();
    if (isFinance || isAdmin) loadFinanceInbox();
    setSelectedExpense(null);
    setScreenMode("list");
    resetDraftItems();
  };

  // Build detail panel with role awareness
  const buildDetailPanel = (isApproverContext = false, isFinanceContext = false) => {
    if (screenMode === "create" || (screenMode !== "list" && selectedExpense)) {
      return (
        <HrmExpenseScreen
          expense={selectedExpense}
          mode={screenMode === "create" ? "create" : "view"}
          isApprover={isApproverContext && screenMode !== "create"}
          isFinance={isFinanceContext && screenMode !== "create"}
          onBack={handleBack}
          onActionComplete={handleActionComplete}
        />
      );
    }
    return (
      <div className={styles.emptyState}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>&#128203;</div>
        <Text type="secondary">Select a report to view details</Text>
      </div>
    );
  };

  // ── Unsettled Advance Warning Banner ──────────────────────────────

  const unsettledBanner = unsettledAdvances.length > 0 ? (
    <Alert
      type="warning"
      showIcon
      icon={<WarningOutlined />}
      style={{ margin: "0 16px 8px" }}
      message={`You have ${unsettledAdvances.length} unsettled advance${unsettledAdvances.length > 1 ? "s" : ""} (${unsettledAdvances.map((a) => `${a.currency} ${a.amount.toLocaleString()}`).join(", ")}).`}
      description="You cannot raise a new advance until existing ones are settled."
      banner
    />
  ) : null;

  // ── Build my expenses tab content ───────────────────────────────────

  const myExpensesTab = (
    <>
      <ExpenseScreenHeader
        title="My Expense Reports"
        actions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
              Export CSV
            </Button>
            <Can I="add">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleNewExpense}>
                New Expense
              </Button>
            </Can>
          </Space>
        }
      />
      {unsettledBanner}
      <ExpenseSearchBar onSearch={loadMyExpenses} />
      <ExpenseMasterDetailTemplate
        listPanel={
          <ExpenseListTable
            expenses={myExpenses}
            loading={listLoading}
            selectedHandle={selectedExpense?.handle}
            onRowClick={handleRowClick}
            onNewExpense={handleNewExpense}
          />
        }
        detailPanel={buildDetailPanel(false, false)}
      />
    </>
  );

  // ── Tabbed view (visible to all roles) ────────────────────────────────

  const buildInboxPanels = (
    inbox: typeof supervisorInbox,
    isApproverCtx: boolean,
    isFinanceCtx: boolean,
  ) => {
    const pending = inbox.filter((e) => ["PENDING_SUPERVISOR", "PENDING_FINANCE"].includes(e.status));
    const escalated = inbox.filter((e) => e.status === "ESCALATED");
    const decided = inbox.filter((e) => !["PENDING_SUPERVISOR", "PENDING_FINANCE", "ESCALATED"].includes(e.status));

    const makePanel = (items: typeof inbox) => (
      <ExpenseMasterDetailTemplate
        listPanel={
          <SupervisorInboxTable
            expenses={items}
            loading={inboxLoading}
            selectedHandle={selectedExpense?.handle}
            onRowClick={handleRowClick}
          />
        }
        detailPanel={buildDetailPanel(isApproverCtx, isFinanceCtx)}
      />
    );

    return {
      pendingPanel: makePanel(pending),
      escalatedPanel: makePanel(escalated),
      decidedPanel: makePanel(decided),
      pendingCount: pending.length,
      escalatedCount: escalated.length,
    };
  };

  const tabItems = [
    { key: "myExpenses", label: "My Expenses", children: myExpensesTab },
  ];

  if (isSupervisor || isAdmin) {
    const panels = buildInboxPanels(supervisorInbox, true, false);
    tabItems.push({
      key: "supervisorInbox",
      label: `Supervisor Inbox (${panels.pendingCount})`,
      children: (
        <ExpenseApproverTemplate
          inboxKind="supervisor"
          pendingPanel={panels.pendingPanel}
          escalatedPanel={panels.escalatedPanel}
          decidedPanel={panels.decidedPanel}
          pendingCount={panels.pendingCount}
          escalatedCount={panels.escalatedCount}
        />
      ),
    });
  }

  if (isFinance || isAdmin) {
    const panels = buildInboxPanels(financeInbox, false, true);
    tabItems.push({
      key: "financeInbox",
      label: `Finance Inbox (${panels.pendingCount})`,
      children: (
        <ExpenseApproverTemplate
          inboxKind="finance"
          pendingPanel={panels.pendingPanel}
          escalatedPanel={panels.escalatedPanel}
          decidedPanel={panels.decidedPanel}
          pendingCount={panels.pendingCount}
          escalatedCount={panels.escalatedCount}
        />
      ),
    });
  }

  // Unsettled advances visible to all users (their own list)
  tabItems.push({
    key: "unsettledAdvances",
    label: `Unsettled Advances${unsettledAdvances.length ? ` (${unsettledAdvances.length})` : ""}`,
    children: (
      <UnsettledAdvancesScreen
        loadAdvances={loadUnsettledAdvances}
        onSettleAdvance={handleSettleAdvance}
      />
    ),
  });

  if (isFinance || isAdmin) {
    tabItems.push({
      key: "reportOop",
      label: "Out-of-Policy Report",
      children: (
        <ExpenseReportScreen
          title="Out-of-Policy Report"
          description="Expense reports flagged as out-of-policy in the selected window."
          organizationId={organizationId}
          fetcher={(p) => HrmExpenseService.getOutOfPolicyReport(p)}
          requireDateRange
        />
      ),
    });
    tabItems.push({
      key: "reportOutstanding",
      label: "Outstanding Advances Report",
      children: (
        <ExpenseReportScreen
          title="Outstanding Advances Report"
          description="Approved advances that have not yet been settled by a reimbursement claim."
          organizationId={organizationId}
          fetcher={(p) => HrmExpenseService.getOutstandingAdvancesReport(p)}
        />
      ),
    });
    tabItems.push({
      key: "reportByDate",
      label: "Reports by Date",
      children: (
        <ExpenseReportScreen
          title="Expense Reports by Date"
          description="All expense reports submitted within the selected window."
          organizationId={organizationId}
          fetcher={(p) => HrmExpenseService.getByDateReport(p)}
          requireDateRange
        />
      ),
    });
  }

  if (isAdmin) {
    tabItems.push({
      key: "categoryConfig",
      label: "Expense Categories",
      children: (
        <div style={{ padding: 16 }}>
          <ExpenseCategoryConfig categories={categories} onRefresh={loadCategories} />
        </div>
      ),
    });
  }

  return (
    <ModuleAccessGate moduleCode="HRM_EXPENSE" appTitle="Expense Reports">
      <div className={`hrm-module-root ${styles.landing}`}>
        <CommonAppBar appTitle="Expense Reports" />
        <Tabs items={tabItems} size="small" tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }} style={{ flex: 1, overflow: "hidden" }} />
      </div>
    </ModuleAccessGate>
  );
};

export default HrmExpenseLanding;
