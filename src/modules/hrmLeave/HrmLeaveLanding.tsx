"use client";

import React, { useEffect, useState } from "react";
import { parseCookies } from "nookies";
import { Tabs, Typography } from "antd";
import CommonAppBar from "@/components/CommonAppBar";
import EmployeeDashboard from "./components/organisms/EmployeeDashboard";
import LeaveRequestsTable from "./components/organisms/LeaveRequestsTable";
import ApproverInboxTable from "./components/organisms/ApproverInboxTable";
import HrGlobalQueueTable from "./components/organisms/HrGlobalQueueTable";
import LedgerHistoryTable from "./components/organisms/LedgerHistoryTable";
import BalanceSummaryTable from "./components/organisms/BalanceSummaryTable";
import AccrualRunPanel from "./components/organisms/AccrualRunPanel";
import ManualAdjustmentForm from "./components/organisms/ManualAdjustmentForm";
import CompOffCreditForm from "./components/organisms/CompOffCreditForm";
import PolicySettingsTable from "./components/organisms/PolicySettingsTable";
import TeamCalendarView from "./components/organisms/TeamCalendarView";
import LeaveCalendarView from "./components/organisms/LeaveCalendarView";
import LeaveRequestFormDrawer from "./components/organisms/LeaveRequestFormDrawer";
import LeaveFilterBar from "./components/molecules/LeaveFilterBar";
import LeaveMasterDetail from "./components/templates/LeaveMasterDetail";
import HrLeaveLayout from "./components/templates/HrLeaveLayout";
import HrmLeaveScreen from "./HrmLeaveScreen";
import { useHrmLeaveStore } from "./stores/hrmLeaveStore";
import { useLeavePermissions } from "./hooks/useLeavePermissions";
import { useHrmLeaveData } from "./hooks/useHrmLeaveData";
import { HR_ROLES, SUPERVISOR_ROLES } from "./utils/constants";
import styles from "./styles/HrmLeave.module.css";

const { Text } = Typography;

const HrmLeaveLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const employeeId = cookies.userId ?? "";
  const role = cookies.userRole ?? "EMPLOYEE";

  const permissions = useLeavePermissions(role);
  const {
    loadBalances,
    loadMyRequests,
    loadPendingForApprover,
    loadGlobalQueue,
    loadLedgerHistory,
    loadLeaveTypes,
    loadBalanceSummary,
  } = useHrmLeaveData(employeeId, role);

  const {
    balances,
    balancesLoading,
    balancesYear,
    myRequests,
    myRequestsLoading,
    pendingRequests,
    pendingRequestsLoading,
    globalQueue,
    globalQueueLoading,
    selectedRequest,
    ledgerHistory,
    ledgerLoading,
    balanceSummary,
    balanceSummaryLoading,
    leaveTypes,
    leaveTypesLoading,
    setSelectedRequest,
    setBalancesYear,
    openLeaveForm,
    activeHrTab,
    showLeaveForm,
  } = useHrmLeaveStore();

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Load data based on role on mount
  useEffect(() => {
    loadBalances();
  }, [balancesYear, site, employeeId]);

  useEffect(() => {
    if (role === "EMPLOYEE" || SUPERVISOR_ROLES.includes(role) || HR_ROLES.includes(role)) {
      loadMyRequests();
    }
  }, [site, employeeId]);

  useEffect(() => {
    if (SUPERVISOR_ROLES.includes(role) || HR_ROLES.includes(role)) {
      loadPendingForApprover();
    }
  }, [site, employeeId, role]);

  useEffect(() => {
    if (permissions.canViewAll) {
      loadGlobalQueue();
    }
  }, [site, permissions.canViewAll]);

  useEffect(() => {
    if (permissions.canViewAll) {
      loadLeaveTypes();
      loadBalanceSummary(balancesYear);
    }
  }, [site, balancesYear, permissions.canViewAll]);

  useEffect(() => {
    loadLedgerHistory();
  }, [site, employeeId]);

  const handleFilterChange = (filters: Record<string, string>) => {
    if (permissions.canViewAll) {
      loadGlobalQueue({
        buId: filters.buId,
        deptId: filters.deptId,
        status: filters.status,
        leaveTypeCode: filters.leaveTypeCode,
        slaBreachOnly: filters.slaBreachOnly,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });
    }
  };

  const handleActionComplete = () => {
    setSelectedRequest(null);
    if (SUPERVISOR_ROLES.includes(role)) loadPendingForApprover();
    if (permissions.canViewAll) loadGlobalQueue();
    loadMyRequests();
    loadBalances();
  };

  const rightPanel = selectedRequest ? (
    <HrmLeaveScreen
      request={selectedRequest}
      site={site}
      permissions={permissions}
      onActionComplete={handleActionComplete}
    />
  ) : (
    <div className={styles.emptyRight}>
      <Text type="secondary">Select a request to view details</Text>
    </div>
  );

  // ── EMPLOYEE VIEW ──────────────────────────────────────────────────

  if (role === "EMPLOYEE") {
    const requestsTab = (
      <LeaveMasterDetail leftWidth="40%">
        <LeaveRequestsTable
          requests={myRequests}
          loading={myRequestsLoading}
          selectedHandle={selectedRequest?.handle}
          onRowClick={setSelectedRequest}
        />
        {rightPanel}
      </LeaveMasterDetail>
    );

    const calendarTab = (
      <LeaveCalendarView
        requests={myRequests}
        year={balancesYear}
        month={calendarMonth}
        onMonthChange={setCalendarMonth}
      />
    );

    const ledgerTab = (
      <LedgerHistoryTable entries={ledgerHistory} loading={ledgerLoading} />
    );

    const tabItems = [
      { key: "requests", label: "My Requests", children: requestsTab },
      { key: "calendar", label: "Calendar", children: calendarTab },
      { key: "ledger", label: "Ledger History", children: ledgerTab },
    ];

    return (
      <div className={styles.landing}>
        <CommonAppBar appTitle="Leave Management" showBack={false} />
        <EmployeeDashboard
          balances={balances}
          year={balancesYear}
          onYearChange={setBalancesYear}
          onApplyLeave={openLeaveForm}
          loading={balancesLoading}
        />
        <LeaveFilterBar role={role} permissions={permissions} />
        <Tabs
          items={tabItems}
          size="small"
          style={{ flex: 1, overflow: "hidden" }}
        />
        {showLeaveForm && (
          <LeaveRequestFormDrawer
            site={site}
            employeeId={employeeId}
            balances={balances}
            onSubmitted={() => {
              loadMyRequests();
              loadBalances();
            }}
          />
        )}
      </div>
    );
  }

  // ── SUPERVISOR VIEW ────────────────────────────────────────────────

  if (SUPERVISOR_ROLES.includes(role)) {
    const approvalTab = (
      <LeaveMasterDetail leftWidth="45%">
        <ApproverInboxTable
          requests={pendingRequests}
          loading={pendingRequestsLoading}
          selectedHandle={selectedRequest?.handle}
          onRowClick={setSelectedRequest}
        />
        {rightPanel}
      </LeaveMasterDetail>
    );

    const teamCalendarTab = (
      <TeamCalendarView requests={pendingRequests} />
    );

    const tabItems = [
      { key: "approvals", label: `Approvals (${pendingRequests.length})`, children: approvalTab },
      { key: "teamCalendar", label: "Team Calendar", children: teamCalendarTab },
    ];

    return (
      <div className={styles.landing}>
        <CommonAppBar appTitle="Leave Management — Approvals" showBack={false} />
        <LeaveFilterBar role={role} permissions={permissions} />
        <Tabs items={tabItems} size="small" style={{ flex: 1, overflow: "hidden" }} />
      </div>
    );
  }

  // ── HR / ADMIN / SUPERADMIN VIEW ───────────────────────────────────

  const queuePanel = (
    <LeaveMasterDetail leftWidth="50%">
      <HrGlobalQueueTable
        requests={globalQueue}
        loading={globalQueueLoading}
        selectedHandle={selectedRequest?.handle}
        onRowClick={setSelectedRequest}
      />
      {rightPanel}
    </LeaveMasterDetail>
  );

  const ledgerPanel = (
    <LeaveMasterDetail leftWidth="35%">
      <BalanceSummaryTable
        balances={balanceSummary}
        loading={balanceSummaryLoading}
      />
      <LedgerHistoryTable entries={ledgerHistory} loading={ledgerLoading} />
    </LeaveMasterDetail>
  );

  const accrualPanel = (
    <AccrualRunPanel site={site} onPosted={() => loadBalanceSummary(balancesYear)} />
  );

  const adjustmentsPanel = (
    <div style={{ display: "flex", gap: 32, padding: 16 }}>
      <ManualAdjustmentForm site={site} onAdjusted={() => loadLedgerHistory()} />
      <CompOffCreditForm site={site} onCredited={() => loadLedgerHistory()} />
    </div>
  );

  const reportsPanel = (
    <div style={{ padding: 24 }}>
      <Text type="secondary">Reports — Export Balance Summary and Leave Availed reports.</Text>
    </div>
  );

  const policyPanel = (
    <PolicySettingsTable
      leaveTypes={leaveTypes}
      loading={leaveTypesLoading}
      site={site}
      onRefresh={loadLeaveTypes}
    />
  );

  return (
    <div className={styles.landing}>
      <CommonAppBar appTitle="Leave Management — HR Console" showBack={false} />
      <LeaveFilterBar
        role={role}
        permissions={permissions}
        onFilterChange={handleFilterChange}
      />
      <HrLeaveLayout
        queuePanel={queuePanel}
        ledgerPanel={ledgerPanel}
        accrualPanel={accrualPanel}
        adjustmentsPanel={adjustmentsPanel}
        reportsPanel={reportsPanel}
        policyPanel={policyPanel}
      />
    </div>
  );
};

export default HrmLeaveLanding;
