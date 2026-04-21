"use client";

import React, { useCallback, useEffect } from "react";
import { parseCookies } from "nookies";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Tabs, Typography, Select, InputNumber, Button, Badge, Empty, Spin, message } from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { HrmLeaveService } from "./services/hrmLeaveService";
import CommonAppBar from "@/components/CommonAppBar";
import EmployeeDashboard from "./components/organisms/EmployeeDashboard";
import LeaveRequestsTable from "./components/organisms/LeaveRequestsTable";
import ApproverInboxTable from "./components/organisms/ApproverInboxTable";
import HrGlobalQueueTable from "./components/organisms/HrGlobalQueueTable";
import LedgerHistoryTable from "./components/organisms/LedgerHistoryTable";
import BalanceSummaryTable from "./components/organisms/BalanceSummaryTable";
import AccrualRunPanel from "./components/organisms/AccrualRunPanel";
import ManualAdjustmentForm from "./components/organisms/ManualAdjustmentForm";
import BulkAdjustmentForm from "./components/organisms/BulkAdjustmentForm";
import CompOffCreditForm from "./components/organisms/CompOffCreditForm";
import CompOffRequestForm from "./components/organisms/CompOffRequestForm";
import CompOffInboxTable from "./components/organisms/CompOffInboxTable";
import CompOffRequestRow from "./components/molecules/CompOffRequestRow";
import PolicySettingsTable from "./components/organisms/PolicySettingsTable";
import YearEndOperationsPanel from "./components/organisms/YearEndOperationsPanel";
import PayrollExportPanel from "./components/organisms/PayrollExportPanel";
import LeaveAvailedReportPanel from "./components/organisms/LeaveAvailedReportPanel";
import LeaveRegisterPanel from "./components/organisms/LeaveRegisterPanel";
import ApprovalConfigPanel from "./components/organisms/ApprovalConfigPanel";
import TeamCalendarView from "./components/organisms/TeamCalendarView";
import LeaveRequestFormDrawer from "./components/organisms/LeaveRequestFormDrawer";
import LeaveFilterBar from "./components/molecules/LeaveFilterBar";
import LeaveMasterDetail from "./components/templates/LeaveMasterDetail";
import HrLeaveLayout from "./components/templates/HrLeaveLayout";
import HrmLeaveScreen from "./HrmLeaveScreen";
import ModuleAccessGate from "../hrmAccess/components/ModuleAccessGate";
import { useCan } from "../hrmAccess/hooks/useCan";
import { useHrmLeaveStore } from "./stores/hrmLeaveStore";
import { useLeavePermissions } from "./hooks/useLeavePermissions";
import { useHrmLeaveData } from "./hooks/useHrmLeaveData";
import { useEmployeeOptions } from "./hooks/useEmployeeOptions";
import { HR_ROLES, SUPERVISOR_ROLES } from "./utils/constants";
import styles from "./styles/HrmLeave.module.css";

const { Text } = Typography;

const HrmLeaveLanding: React.FC = () => {
  const organizationId = getOrganizationId();
  const cookies = parseCookies();
  const employeeId = cookies.employeeId ?? cookies.userId ?? "";
  const cookieRole = (cookies.userRole ?? cookies.role ?? "EMPLOYEE").toUpperCase();

  // RBAC-driven role: canDelete -> Admin/HR, canEdit -> Supervisor, canAdd -> Employee.
  // When the backend has published HRM_LEAVE grants we trust them exclusively;
  // the cookie role is only consulted as a fallback for environments where
  // RBAC isn't wired yet.
  const modulePerms = useCan("HRM_LEAVE");
  const rbacPublished =
    modulePerms.canView || modulePerms.canAdd || modulePerms.canEdit || modulePerms.canDelete;
  const isHrAdmin = rbacPublished
    ? modulePerms.canDelete
    : HR_ROLES.includes(cookieRole);
  const isSupervisor =
    !isHrAdmin &&
    (rbacPublished ? modulePerms.canEdit : SUPERVISOR_ROLES.includes(cookieRole));
  const role = isHrAdmin ? "HR" : isSupervisor ? "SUPERVISOR" : "EMPLOYEE";

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
    ledgerEmployeeId,
    ledgerYear,
    ledgerLeaveTypeFilter,
    balanceSummary,
    balanceSummaryLoading,
    leaveTypes,
    leaveTypesLoading,
    setSelectedRequest,
    setBalancesYear,
    setLedgerEmployeeId,
    setLedgerYear,
    setLedgerLeaveTypeFilter,
    openLeaveForm,
    activeTab,
    setActiveTab,
    activeHrTab,
    showLeaveForm,
    compOffRequests,
    compOffRequestsLoading,
    compOffPending,
    compOffPendingLoading,
    setCompOffRequests,
    setCompOffRequestsLoading,
    setCompOffPending,
    setCompOffPendingLoading,
    showCompOffForm,
    openCompOffForm,
  } = useHrmLeaveStore();

  const { options: employeeOptions, loading: employeeOptionsLoading } = useEmployeeOptions();

  // Load data based on role on mount
  useEffect(() => {
    loadBalances();
  }, [balancesYear, organizationId, employeeId, loadBalances]);

  useEffect(() => {
    if (role === "EMPLOYEE" || SUPERVISOR_ROLES.includes(role) || HR_ROLES.includes(role)) {
      loadMyRequests();
    }
  }, [organizationId, employeeId, role, loadMyRequests]);

  useEffect(() => {
    if (SUPERVISOR_ROLES.includes(role) || HR_ROLES.includes(role)) {
      loadPendingForApprover();
    }
  }, [organizationId, employeeId, role, loadPendingForApprover]);

  useEffect(() => {
    if (permissions.canViewAll) {
      loadGlobalQueue();
    }
  }, [organizationId, permissions.canViewAll, loadGlobalQueue]);

  useEffect(() => {
    if (permissions.canViewAll) {
      loadLeaveTypes();
      loadBalanceSummary(balancesYear);
    }
  }, [organizationId, balancesYear, permissions.canViewAll, loadLeaveTypes, loadBalanceSummary]);

  useEffect(() => {
    loadLedgerHistory();
  }, [organizationId, employeeId, ledgerEmployeeId, ledgerYear, ledgerLeaveTypeFilter, loadLedgerHistory]);

  // ── Comp-Off Workflow Data ──────────────────────────────────────────
  const loadMyCompOffRequests = useCallback(async () => {
    if (!employeeId) return;
    setCompOffRequestsLoading(true);
    try {
      const res = await HrmLeaveService.getMyCompOffRequests({ organizationId, employeeId });
      setCompOffRequests(res);
    } catch {
      message.error("Failed to load comp-off requests");
    } finally {
      setCompOffRequestsLoading(false);
    }
  }, [organizationId, employeeId, setCompOffRequests, setCompOffRequestsLoading]);

  const loadPendingCompOffs = useCallback(async () => {
    if (!employeeId) return;
    setCompOffPendingLoading(true);
    try {
      const res = await HrmLeaveService.getPendingCompOffs({ organizationId, approverId: employeeId });
      setCompOffPending(res);
    } catch {
      message.error("Failed to load pending comp-off requests");
    } finally {
      setCompOffPendingLoading(false);
    }
  }, [organizationId, employeeId, setCompOffPending, setCompOffPendingLoading]);

  useEffect(() => {
    loadMyCompOffRequests();
  }, [loadMyCompOffRequests]);

  useEffect(() => {
    if (isSupervisor || isHrAdmin) {
      loadPendingCompOffs();
    }
  }, [isSupervisor, isHrAdmin, loadPendingCompOffs]);

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
      organizationId={organizationId}
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

    const compOffTab = (
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text strong>My Comp-Off Requests</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCompOffForm}>
            Request Comp-Off
          </Button>
        </div>
        {compOffRequestsLoading ? (
          <div className={styles.panelLoading}><Spin tip="Loading comp-off requests..." /></div>
        ) : compOffRequests.length === 0 ? (
          <Empty description="No comp-off requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          compOffRequests.map((req) => <CompOffRequestRow key={req.handle} request={req} />)
        )}
      </div>
    );

    const tabItems = [
      { key: "requests", label: "My Requests", children: requestsTab },
      { key: "compOff", label: "Comp-Off", children: compOffTab },
    ];

    return (
      <ModuleAccessGate moduleCode="HRM_LEAVE" appTitle="Leave Management">
        <div className={`hrm-module-root ${styles.landing}`}>
          <CommonAppBar appTitle="Leave Management" />
          <EmployeeDashboard
            balances={balances}
            year={balancesYear}
            onYearChange={setBalancesYear}
            onApplyLeave={() => openLeaveForm()}
            loading={balancesLoading}
          />
          <LeaveFilterBar role={role} permissions={permissions} />
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="small"
            tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
            style={{ flex: 1, overflow: "hidden" }}
          />
          {showLeaveForm && (
            <LeaveRequestFormDrawer
              organizationId={organizationId}
              employeeId={employeeId}
              balances={balances}
              onSubmitted={() => {
                loadMyRequests();
                loadBalances();
              }}
            />
          )}
          {showCompOffForm && (
            <CompOffRequestForm onSubmitted={loadMyCompOffRequests} />
          )}
        </div>
      </ModuleAccessGate>
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
          organizationId={organizationId}
          employeeId={employeeId}
          role={role}
          onActionComplete={handleActionComplete}
        />
        {rightPanel}
      </LeaveMasterDetail>
    );

    const teamCalendarTab = (
      <TeamCalendarView requests={pendingRequests} />
    );

    const compOffInboxTab = (
      <CompOffInboxTable
        requests={compOffPending}
        loading={compOffPendingLoading}
        organizationId={organizationId}
        employeeId={employeeId}
        onActionComplete={() => {
          loadPendingCompOffs();
          loadMyCompOffRequests();
        }}
      />
    );

    const compOffMyTab = (
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text strong>My Comp-Off Requests</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCompOffForm}>
            Request Comp-Off
          </Button>
        </div>
        {compOffRequestsLoading ? (
          <div className={styles.panelLoading}><Spin tip="Loading comp-off requests..." /></div>
        ) : compOffRequests.length === 0 ? (
          <Empty description="No comp-off requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          compOffRequests.map((req) => <CompOffRequestRow key={req.handle} request={req} />)
        )}
      </div>
    );

    const compOffLabel = compOffPending.length > 0
      ? <Badge count={compOffPending.length} size="small" offset={[8, 0]}>Comp-Off Approvals</Badge>
      : "Comp-Off Approvals";

    const tabItems = [
      { key: "approvals", label: `Approvals (${pendingRequests.length})`, children: approvalTab },
      { key: "compOffInbox", label: compOffLabel, children: compOffInboxTab },
      { key: "compOffMy", label: "My Comp-Off", children: compOffMyTab },
      { key: "teamCalendar", label: "Team Calendar", children: teamCalendarTab },
    ];

    return (
      <ModuleAccessGate moduleCode="HRM_LEAVE" appTitle="Leave Management — Approvals">
        <div className={`hrm-module-root ${styles.landing}`}>
          <CommonAppBar appTitle="Leave Management — Approvals" />
          <EmployeeDashboard
            balances={balances}
            year={balancesYear}
            onYearChange={setBalancesYear}
            onApplyLeave={() => openLeaveForm()}
            loading={balancesLoading}
          />
          <LeaveFilterBar role={role} permissions={permissions} />
          <Tabs items={tabItems} size="small" tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }} style={{ flex: 1, overflow: "hidden" }} />
          {showLeaveForm && (
            <LeaveRequestFormDrawer
              organizationId={organizationId}
              employeeId={employeeId}
              balances={balances}
              onSubmitted={() => {
                loadMyRequests();
                loadBalances();
              }}
            />
          )}
          {showCompOffForm && (
            <CompOffRequestForm onSubmitted={loadMyCompOffRequests} />
          )}
        </div>
      </ModuleAccessGate>
    );
  }

  // ── HR / ADMIN / SUPERADMIN VIEW ───────────────────────────────────

  const queuePanel = (
    <div className={styles.requestsPanel}>
      <div className={styles.requestsToolbar}>
        <span className={styles.requestsToolbarTitle}>
          Leave Requests · {globalQueue.length}
        </span>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openLeaveForm()}
        >
          Raise Leave Request
        </Button>
      </div>
      <LeaveMasterDetail leftWidth="50%">
        <HrGlobalQueueTable
          requests={globalQueue}
          loading={globalQueueLoading}
          selectedHandle={selectedRequest?.handle}
          onRowClick={setSelectedRequest}
          organizationId={organizationId}
          employeeId={employeeId}
          role={role}
          onActionComplete={handleActionComplete}
        />
        {rightPanel}
      </LeaveMasterDetail>
    </div>
  );

  const leaveTypeOptions = leaveTypes.map((lt) => ({
    value: lt.code,
    label: `${lt.code} - ${lt.name}`,
  }));

  const ledgerPanel = (
    <div className={styles.ledgerPanel}>
      {/* Filter toolbar */}
      <div className={styles.ledgerToolbar}>
        <span className={styles.ledgerToolbarLabel}>Employee</span>
        <Select
          showSearch
          allowClear
          placeholder="Search by ID or name"
          value={ledgerEmployeeId ?? undefined}
          onChange={(value) => setLedgerEmployeeId(value ?? null)}
          options={employeeOptions}
          loading={employeeOptionsLoading}
          style={{ minWidth: 280 }}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        />
        <span className={styles.ledgerToolbarLabel}>Year</span>
        <InputNumber
          min={2000}
          max={2100}
          value={ledgerYear}
          onChange={(value) => value && setLedgerYear(value)}
          style={{ width: 100 }}
        />
        <span className={styles.ledgerToolbarLabel}>Type</span>
        <Select
          allowClear
          placeholder="All leave types"
          value={ledgerLeaveTypeFilter ?? undefined}
          onChange={(value) => setLedgerLeaveTypeFilter(value ?? null)}
          options={leaveTypeOptions}
          style={{ minWidth: 200 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => loadLedgerHistory()}>
          Refresh
        </Button>
      </div>

      {/* Top: Balance Summary + Ledger History */}
      <div className={styles.ledgerTopGrid}>
        <div className={styles.ledgerCard}>
          <div className={styles.ledgerCardHeader}>
            <span className={styles.ledgerCardTitle}>Balance Summary</span>
          </div>
          <div className={styles.ledgerCardBody}>
            <BalanceSummaryTable
              balances={balanceSummary}
              loading={balanceSummaryLoading}
            />
          </div>
        </div>
        <div className={styles.ledgerCard}>
          <div className={styles.ledgerCardHeader}>
            <span className={styles.ledgerCardTitle}>
              Ledger History {ledgerEmployeeId ? `— ${ledgerEmployeeId}` : ""}
            </span>
          </div>
          <div className={styles.ledgerCardBody}>
            <LedgerHistoryTable entries={ledgerHistory} loading={ledgerLoading} />
          </div>
        </div>
      </div>

      {/* Bottom: Adjustment forms */}
      <div className={styles.ledgerFormsGrid}>
        <div className={styles.ledgerCard}>
          <div className={styles.ledgerCardHeader}>
            <span className={styles.ledgerCardTitle}>Manual Adjustment</span>
          </div>
          <div className={styles.ledgerCardBody}>
            <ManualAdjustmentForm organizationId={organizationId} onAdjusted={() => loadLedgerHistory()} />
          </div>
        </div>
        <div className={styles.ledgerCard}>
          <div className={styles.ledgerCardHeader}>
            <span className={styles.ledgerCardTitle}>Credit Comp Off (Direct)</span>
          </div>
          <div className={styles.ledgerCardBody}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
              For workflow-based comp-off, employees submit claims from their dashboard.
            </Text>
            <CompOffCreditForm organizationId={organizationId} onCredited={() => loadLedgerHistory()} />
          </div>
        </div>
        <div className={styles.ledgerCard}>
          <div className={styles.ledgerCardHeader}>
            <span className={styles.ledgerCardTitle}>Bulk Adjustment</span>
          </div>
          <div className={styles.ledgerCardBody}>
            <BulkAdjustmentForm organizationId={organizationId} onAdjusted={() => loadLedgerHistory()} />
          </div>
        </div>
      </div>
    </div>
  );

  const accrualPanel = (
    <AccrualRunPanel organizationId={organizationId} onPosted={() => loadBalanceSummary(balancesYear)} />
  );

  const policyPanel = (
    <PolicySettingsTable
      leaveTypes={leaveTypes}
      loading={leaveTypesLoading}
      organizationId={organizationId}
      onRefresh={loadLeaveTypes}
    />
  );

  const yearEndPanel = (
    <YearEndOperationsPanel
      organizationId={organizationId}
      onProcessed={() => loadBalanceSummary(balancesYear)}
    />
  );

  const payrollPanel = <PayrollExportPanel organizationId={organizationId} />;

  const reportsPanel = <LeaveAvailedReportPanel organizationId={organizationId} />;

  const approvalConfigPanel = <ApprovalConfigPanel organizationId={organizationId} />;

  return (
    <ModuleAccessGate moduleCode="HRM_LEAVE" appTitle="Leave Management — HR Console">
      <div className={`hrm-module-root ${styles.landing}`}>
        <CommonAppBar appTitle="Leave Management — HR Console" />
        <LeaveFilterBar
          role={role}
          permissions={permissions}
          onFilterChange={handleFilterChange}
        />
        <HrLeaveLayout
          queuePanel={queuePanel}
          ledgerPanel={ledgerPanel}
          accrualPanel={accrualPanel}
          policyPanel={policyPanel}
          yearEndPanel={yearEndPanel}
          payrollPanel={payrollPanel}
          reportsPanel={reportsPanel}
          approvalConfigPanel={approvalConfigPanel}
        />
        {showLeaveForm && (
          <LeaveRequestFormDrawer
            organizationId={organizationId}
            employeeId={employeeId}
            balances={balances}
            allowEmployeeSelection
            onSubmitted={() => {
              loadMyRequests();
              loadBalances();
              loadGlobalQueue();
            }}
          />
        )}
      </div>
    </ModuleAccessGate>
  );
};

export default HrmLeaveLanding;
