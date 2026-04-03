"use client";

import React, { useEffect, useCallback, useState } from "react";
import { Alert, Button, Tabs, Typography, Space } from "antd";
import { PlusOutlined, DownloadOutlined, WarningOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmExpenseStore } from "./stores/hrmExpenseStore";
import { useExpenseData } from "./hooks/useExpenseData";
import ExpenseSearchBar from "./components/molecules/ExpenseSearchBar";
import ExpenseListTable from "./components/organisms/ExpenseListTable";
import SupervisorInboxTable from "./components/organisms/SupervisorInboxTable";
import ExpenseCategoryConfig from "./components/organisms/ExpenseCategoryConfig";
import ExpenseMasterDetailTemplate from "./components/templates/ExpenseMasterDetailTemplate";
import ExpenseApproverTemplate from "./components/templates/ExpenseApproverTemplate";
import ExpenseScreenHeader from "./components/organisms/ExpenseScreenHeader";
import HrmExpenseScreen from "./HrmExpenseScreen";
import type { UnsettledAdvance } from "./types/api.types";
import styles from "./styles/Expense.module.css";

const { Text } = Typography;

const SUPERVISOR_ROLES = ["SUPERVISOR", "NEXT_SUPERIOR", "MANAGER"];
const FINANCE_ROLES = ["FINANCE", "FINANCE_ADMIN"];
const ADMIN_ROLES = ["ADMIN", "HR", "SUPERADMIN"];

const HrmExpenseLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
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
    setSelectedExpense,
    setScreenMode,
    resetFormState,
    resetDraftItems,
  } = useHrmExpenseStore();

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
  }, [site]);

  useEffect(() => {
    if (isSupervisor || isAdmin) {
      loadSupervisorInbox();
    }
  }, [site, role]);

  useEffect(() => {
    if (isFinance || isAdmin) {
      loadFinanceInbox();
    }
  }, [site, role]);

  // Auto-trigger search when filters change
  useEffect(() => {
    loadMyExpenses();
  }, [statusFilter, typeFilter, dateRange]);

  const handleNewExpense = () => {
    setSelectedExpense(null);
    resetFormState();
    resetDraftItems();
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
            <Button icon={<DownloadOutlined />} onClick={exportExpenses}>
              Export CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNewExpense}>
              New Expense
            </Button>
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

  // Employee only sees their expenses
  if (!isSupervisor && !isFinance && !isAdmin) {
    return (
      <div className={`hrm-module-root ${styles.landing}`}>
        <CommonAppBar appTitle="Expense Reports" />
        {myExpensesTab}
      </div>
    );
  }

  // ── Supervisor / Finance / Admin view with tabs ───────────────────────

  const buildInboxPanels = (
    inbox: typeof supervisorInbox,
    isApproverCtx: boolean,
    isFinanceCtx: boolean,
  ) => {
    const pending = inbox.filter((e) => ["PENDING_SUPERVISOR", "PENDING_FINANCE", "SUBMITTED"].includes(e.status));
    const escalated = inbox.filter((e) => e.status === "ESCALATED");
    const decided = inbox.filter((e) => !["PENDING_SUPERVISOR", "PENDING_FINANCE", "SUBMITTED", "ESCALATED"].includes(e.status));

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
          pendingPanel={panels.pendingPanel}
          escalatedPanel={panels.escalatedPanel}
          decidedPanel={panels.decidedPanel}
          pendingCount={panels.pendingCount}
          escalatedCount={panels.escalatedCount}
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
    <div className={`hrm-module-root ${styles.landing}`}>
      <CommonAppBar appTitle="Expense Reports" />
      <Tabs items={tabItems} size="small" tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }} style={{ flex: 1, overflow: "hidden" }} />
    </div>
  );
};

export default HrmExpenseLanding;
