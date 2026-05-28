"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { parseCookies } from "nookies";
import { getOrganizationId } from '@/utils/cookieUtils';
import { Tabs, Typography, Select, InputNumber, Button, Badge, Empty, Spin, Modal, message, DatePicker, Tooltip } from "antd";
import { ReloadOutlined, PlusOutlined, EditOutlined, UploadOutlined, GiftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
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
import BlackoutPeriodPanel from "./components/organisms/BlackoutPeriodPanel";
import LeaveAnalyticsPanel from "./components/organisms/LeaveAnalyticsPanel";
import TeamCalendarView from "./components/organisms/TeamCalendarView";
import TeamHistoryPanel from "./components/organisms/TeamHistoryPanel";
import LeaveRequestFormDrawer from "./components/organisms/LeaveRequestFormDrawer";
import LeaveFilterBar from "./components/molecules/LeaveFilterBar";
import LeaveStatusChip from "./components/atoms/LeaveStatusChip";
import LeaveMasterDetail from "./components/templates/LeaveMasterDetail";
import HrmLeaveScreen from "./HrmLeaveScreen";
import PermissionGate from "./components/atoms/PermissionGate";
import ModuleAccessGate from "../hrmAccess/components/ModuleAccessGate";
import { useCan } from "../hrmAccess/hooks/useCan";
import { useHrmLeaveStore } from "./stores/hrmLeaveStore";
import { useLeavePermissions } from "./hooks/useLeavePermissions";
import { useHrmLeaveData } from "./hooks/useHrmLeaveData";
import { useEmployeeOptions } from "./hooks/useEmployeeOptions";
import { useCurrentEmployeeStore } from "../hrmAccess/stores/currentEmployeeStore";
import { useEmployeeIdentity } from "../hrmAccess/hooks/useEmployeeIdentity";
import { HR_ROLES, SUPERVISOR_ROLES, LEAVE_STATUS_LABELS } from "./utils/constants";
import { LeaveRequest } from "./types/domain.types";
import styles from "./styles/HrmLeave.module.css";

const { Text } = Typography;

const statusFilterOptions = Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/* ── Supervisor Team History sub-component ────────────────────────── */

interface SupervisorTeamHistoryProps {
  requests: LeaveRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: LeaveRequest) => void;
  rightPanel: React.ReactNode;
  supervisorId: string;
  leaveTypeOptions?: { value: string; label: string }[];
  employeeOptions?: { value: string; label: string }[];
}

const SupervisorTeamHistory: React.FC<SupervisorTeamHistoryProps> = ({
  requests,
  loading,
  selectedHandle,
  onRowClick,
  rightPanel,
  supervisorId,
  leaveTypeOptions = [],
  employeeOptions = [],
}) => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (req.employeeId === supervisorId) return false;
      if (statusFilter && req.status !== statusFilter) return false;
      if (employeeFilter) {
        const empMatch =
          req.employeeId === employeeFilter ||
          req.employeeName?.includes(employeeFilter) ||
          req.employeeId?.includes(employeeFilter);
        if (!empMatch) return false;
      }
      if (leaveTypeFilter && req.leaveTypeCode !== leaveTypeFilter) return false;
      if (dateRange) {
        const start = dayjs(req.startDate);
        const end = dayjs(req.endDate);
        const rangeFrom = dayjs(dateRange[0]);
        const rangeTo = dayjs(dateRange[1]);
        if (end.isBefore(rangeFrom) || start.isAfter(rangeTo)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, employeeFilter, leaveTypeFilter, dateRange, supervisorId]);

  if (loading) {
    return (
      <div className={styles.panelLoading}>
        <Spin tip="Loading team history..." />
      </div>
    );
  }

  return (
    <LeaveMasterDetail leftWidth="45%">
      <div className={styles.requestsList}>
        <div className={styles.requestsListHeader}>
          <Text strong>Team Leave History ({filteredRequests.length})</Text>
          {(statusFilter || employeeFilter || leaveTypeFilter || dateRange) && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setStatusFilter(undefined);
                setEmployeeFilter(undefined);
                setLeaveTypeFilter(undefined);
                setDateRange(null);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}>
          <Select
            placeholder="Employee"
            allowClear
            showSearch
            value={employeeFilter}
            onChange={(val) => setEmployeeFilter(val)}
            options={employeeOptions}
            style={{ minWidth: 180 }}
            size="small"
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Select
            placeholder="Leave Type"
            allowClear
            value={leaveTypeFilter}
            onChange={(val) => setLeaveTypeFilter(val)}
            options={leaveTypeOptions}
            style={{ minWidth: 130 }}
            size="small"
          />
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={statusFilterOptions}
            style={{ minWidth: 150 }}
            size="small"
          />
          <DatePicker.RangePicker
            size="small"
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(_, strs) => {
              if (strs[0] && strs[1]) setDateRange([strs[0], strs[1]]);
              else setDateRange(null);
            }}
            style={{ minWidth: 220 }}
            format="DD/MM/YYYY"
          />
        </div>
        {filteredRequests.length === 0 ? (
          <div className={styles.panelEmpty}>
            <Empty description="No team leave requests found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.handle}
              className={`${styles.requestRow} ${req.handle === selectedHandle ? styles.requestRowSelected : ""}`}
              onClick={() => onRowClick(req)}
            >
              <div className={styles.requestRowTop}>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>{req.employeeName || req.employeeId}</Text>
                <LeaveStatusChip status={req.status} />
              </div>
              <div className={styles.requestRowMid}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {req.leaveTypeName || req.leaveTypeCode} &middot;{" "}
                  {new Date(req.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  {" – "}
                  {new Date(req.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </Text>
              </div>
              <div className={styles.requestRowBottom}>
                <Text style={{ fontSize: 12 }}>{req.totalDays.toFixed(1)} days</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(req.createdDateTime).toLocaleDateString("en-GB")}
                </Text>
              </div>
            </div>
          ))
        )}
      </div>
      {rightPanel}
    </LeaveMasterDetail>
  );
};

const HrmLeaveLanding: React.FC = () => {
  const organizationId = getOrganizationId();
  const cookies = parseCookies();
  // Resolve the signed-in employee's identity. Backend leave service
  // expects composite `"EMP0012 - John Doe"` for employeeId / approverId /
  // createdBy / etc. (employee service is excluded — it still takes the
  // raw handle/code). We pass the composite as `employeeId` down the tree
  // and let the drawer reach for identity.handle internally for the one
  // hrm-service/employee/* call it makes (fetchProfile).
  const currentEmployee = useCurrentEmployeeStore(s => s.data);
  const identity = useEmployeeIdentity();
  const employeeId = identity.employeeIdWithName || currentEmployee?.handle || cookies.employeeId || cookies.userId || "";
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
    ledgerDeptFilter,
    balanceSummary,
    balanceSummaryLoading,
    leaveTypes,
    leaveTypesLoading,
    setSelectedRequest,
    setBalancesYear,
    setLedgerEmployeeId,
    setLedgerYear,
    setLedgerLeaveTypeFilter,
    setLedgerDeptFilter,
    openLeaveForm,
    activeTab,
    setActiveTab,
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

  const { options: employeeOptions, employees: directoryEmployees, loading: employeeOptionsLoading } = useEmployeeOptions();

  // Department filter for the HR Ledger / Balance Summary view. Stored
  // globally so `loadLedgerHistory` (which hits `/ledger/report`) and the
  // Balance Summary fetch read it directly.
  const ledgerDeptOptions = useMemo(() => {
    const depts = new Set<string>();
    for (const emp of directoryEmployees) {
      const d = (emp.department || "").trim();
      if (d) depts.add(d);
    }
    return Array.from(depts).sort().map((d) => ({ value: d, label: d }));
  }, [directoryEmployees]);

  // Ledger panel action modals (Manual / Bulk / Comp-Off) — kept at the top
  // of the page so users don't have to scroll past tables to reach the forms.
  const [manualAdjModalOpen, setManualAdjModalOpen] = useState(false);
  const [bulkAdjModalOpen, setBulkAdjModalOpen] = useState(false);
  const [compOffCreditModalOpen, setCompOffCreditModalOpen] = useState(false);

  // Load data based on role on mount
  useEffect(() => {
    loadBalances();
  }, [balancesYear, organizationId, employeeId, loadBalances]);

  useEffect(() => {
    loadMyRequests();
  }, [organizationId, employeeId, loadMyRequests]);

  useEffect(() => {
    if (permissions.canViewApprovalQueue) {
      loadPendingForApprover();
    }
  }, [organizationId, employeeId, permissions.canViewApprovalQueue, loadPendingForApprover]);

  useEffect(() => {
    // The global queue also backs the hierarchy-scoped Team History tab, so
    // load it for team-calendar (manager) permission too — not just HR.
    if (permissions.canViewHrQueue || permissions.canViewTeamCalendar) {
      loadGlobalQueue();
    }
  }, [organizationId, permissions.canViewHrQueue, permissions.canViewTeamCalendar, loadGlobalQueue]);

  useEffect(() => {
    if (permissions.canViewPolicy || permissions.canViewLedger || permissions.canViewBalance) {
      loadLeaveTypes();
      loadBalanceSummary(balancesYear, { deptId: ledgerDeptFilter ?? undefined });
    }
  }, [organizationId, balancesYear, ledgerDeptFilter, permissions.canViewPolicy, permissions.canViewLedger, permissions.canViewBalance, loadLeaveTypes, loadBalanceSummary]);

  useEffect(() => {
    loadLedgerHistory();
  }, [organizationId, employeeId, ledgerEmployeeId, ledgerYear, ledgerLeaveTypeFilter, ledgerDeptFilter, loadLedgerHistory]);

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
    if (permissions.canEditCompOff) {
      loadPendingCompOffs();
    }
  }, [permissions.canEditCompOff, loadPendingCompOffs]);

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
    if (permissions.canViewApprovalQueue) loadPendingForApprover();
    if (permissions.canViewHrQueue) loadGlobalQueue();
    loadMyRequests();
    loadBalances();
  };

  // ── Per-tab data refresh (item 12) ─────────────────────────────────
  // Re-fetch the data backing a given tab. Called on every tab change and
  // by the global Refresh button so each tab always shows fresh data.
  // Self-contained panels (accrual, reports, register, analytics, year-end,
  // payroll, approval-config) fetch on their own mount.
  const refreshActiveTab = useCallback(
    (tabKey: string) => {
      switch (tabKey) {
        case "requests":
          loadMyRequests();
          loadBalances();
          break;
        case "approvals":
          if (permissions.canViewApprovalQueue) loadPendingForApprover();
          break;
        case "teamHistory":
          if (permissions.canViewHrQueue) loadGlobalQueue();
          break;
        case "teamHistoryHierarchy":
          if (permissions.canViewHrQueue || permissions.canViewTeamCalendar) loadGlobalQueue();
          break;
        case "compOffInbox":
          if (permissions.canEditCompOff) loadPendingCompOffs();
          break;
        case "compOff":
          loadMyCompOffRequests();
          break;
        case "teamCalendar":
          if (permissions.canViewApprovalQueue) loadPendingForApprover();
          break;
        case "ledger":
          loadLedgerHistory();
          if (permissions.canViewBalance) {
            loadBalanceSummary(balancesYear, { deptId: ledgerDeptFilter ?? undefined });
          }
          break;
        case "policy":
          loadLeaveTypes();
          break;
        default:
          break;
      }
    },
    [
      permissions,
      loadMyRequests,
      loadBalances,
      loadPendingForApprover,
      loadGlobalQueue,
      loadPendingCompOffs,
      loadMyCompOffRequests,
      loadLedgerHistory,
      loadBalanceSummary,
      loadLeaveTypes,
      balancesYear,
      ledgerDeptFilter,
    ],
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    refreshActiveTab(key);
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

  // ── Unified RBAC-driven view ───────────────────────────────────────
  // All tabs are built from section-level permissions; the role only affects
  // content within certain tabs (e.g. HR sees the full queue with filters,
  // supervisors see a team-filtered history).

  // Approver-filtered subset used in the Approval Queue tab.
  const myComposite = identity.employeeIdWithName;
  const myCode = identity.employeeCode;
  const myHandle = identity.handle;
  const myIds = [
    myComposite,
    myCode,
    myHandle,
    cookies.userId,
    cookies.employeeCode,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);
  const approverFiltered = isHrAdmin
    ? pendingRequests
    : pendingRequests.filter((req) => {
        const raw = req.currentApproverId;
        if (!raw) return false;
        const stripped = raw.includes("_") ? raw.substring(raw.indexOf("_") + 1) : raw;
        const code = stripped.includes(" - ")
          ? stripped.split(" - ")[0]?.trim() ?? stripped
          : stripped;
        return myIds.some((mine) => mine === stripped || mine === code);
      });

  // ── Tab: My Requests ──────────────────────────────────────────────
  const requestsTab = (
    <PermissionGate object="leave_request" action="view">
      <LeaveMasterDetail leftWidth="40%">
        <LeaveRequestsTable
          requests={myRequests}
          loading={myRequestsLoading}
          selectedHandle={selectedRequest?.handle}
          onRowClick={setSelectedRequest}
          onRequestDeleted={() => {
            loadMyRequests();
            loadBalances();
          }}
        />
        {rightPanel}
      </LeaveMasterDetail>
    </PermissionGate>
  );

  // ── Tab: Approval Queue ───────────────────────────────────────────
  const approvalTab = (
    <PermissionGate object="leave_approval" action="view">
      <LeaveMasterDetail leftWidth="45%">
        <ApproverInboxTable
          requests={approverFiltered}
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
    </PermissionGate>
  );

  // ── Tab: Team History / All Requests (content adapts by role) ────
  const teamHistoryTab = (
    <PermissionGate object="leave_hr_queue" action="view">
      {isHrAdmin ? (
        <div className={styles.requestsPanel}>
          <LeaveFilterBar
            role={role}
            permissions={permissions}
            onFilterChange={handleFilterChange}
          />
          <div className={styles.requestsToolbar}>
            <span className={styles.requestsToolbarTitle}>
              Leave Requests · {globalQueue.length}
            </span>
            <PermissionGate object="leave_request" action="add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openLeaveForm()}
              >
                Raise Leave Request
              </Button>
            </PermissionGate>
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
      ) : (
        <SupervisorTeamHistory
          requests={globalQueue}
          loading={globalQueueLoading}
          selectedHandle={selectedRequest?.handle}
          onRowClick={setSelectedRequest}
          rightPanel={rightPanel}
          supervisorId={employeeId}
          leaveTypeOptions={leaveTypes.map((lt) => ({ value: lt.code, label: `${lt.code} – ${lt.name}` }))}
          employeeOptions={employeeOptions}
        />
      )}
    </PermissionGate>
  );

  // ── Tab: Comp-Off Approvals ───────────────────────────────────────
  const compOffInboxTab = (
    <PermissionGate object="leave_comp_off" action="edit">
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
    </PermissionGate>
  );

  // ── Tab: My Comp-Off ──────────────────────────────────────────────
  const compOffTab = (
    <PermissionGate object="leave_comp_off" action="view">
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text strong>My Comp-Off Requests</Text>
          <PermissionGate object="leave_comp_off" action="view">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCompOffForm}>
              Request Comp-Off
            </Button>
          </PermissionGate>
        </div>
        {compOffRequestsLoading ? (
          <div className={styles.panelLoading}><Spin tip="Loading comp-off requests..." /></div>
        ) : compOffRequests.length === 0 ? (
          <Empty description="No comp-off requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          compOffRequests.map((req) => <CompOffRequestRow key={req.handle} request={req} />)
        )}
      </div>
    </PermissionGate>
  );

  // ── Tab: Team Calendar ────────────────────────────────────────────
  const teamCalendarTab = (
    <PermissionGate object="leave_team_calendar" action="view">
      <TeamCalendarView requests={pendingRequests} />
    </PermissionGate>
  );

  const compOffLabel = compOffPending.length > 0
    ? <Badge count={compOffPending.length} size="small" offset={[8, 0]}>Comp-Off Approvals</Badge>
    : "Comp-Off Approvals";

  const leaveTypeOptions = leaveTypes.map((lt) => ({
    value: lt.code,
    label: `${lt.code} - ${lt.name}`,
  }));

  // ledgerEmployeeId is now a composite "EMP-CODE - Full Name" so it's
  // already human-readable. Keep the lookup for safety in case of legacy
  // UUID values lingering in store state.
  const ledgerEmployeeLabel = (() => {
    if (!ledgerEmployeeId) return "";
    const matchFromOptions = employeeOptions.find(
      (o) => o.value === ledgerEmployeeId,
    )?.label;
    return matchFromOptions ?? ledgerEmployeeId;
  })();

  const ledgerPanel = (
    <PermissionGate object="leave_ledger" action="view">
      <div className={styles.ledgerPanel}>
        {/* Filter toolbar + action buttons (forms moved into modals so they
            are always accessible without scrolling past the tables). */}
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
            onChange={(value) => {
              if (!value) return;
              setLedgerYear(value);
              // Balance Summary uses its own `balancesYear` — keep it in sync
              // so the Admin Ledger toolbar refreshes both panels together.
              setBalancesYear(value);
            }}
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
          {/* Department filter narrows both the Balance Summary
              (/leave-balance/retrieve) and the Ledger History
              (/ledger/report) responses. The legacy /ledger/history endpoint
              silently drops deptId — the new wiring lets HR see ledger
              entries across all employees in a department. */}
          <span className={styles.ledgerToolbarLabel}>Department</span>
          <Select
            allowClear
            showSearch
            placeholder="All departments"
            value={ledgerDeptFilter ?? undefined}
            onChange={(value) => setLedgerDeptFilter(value || null)}
            options={ledgerDeptOptions}
            style={{ minWidth: 180 }}
            disabled={!!ledgerEmployeeId}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadLedgerHistory();
              if (permissions.canViewBalance) {
                loadBalanceSummary(balancesYear, { deptId: ledgerDeptFilter ?? undefined });
              }
            }}
          >
            Refresh
          </Button>
          <div style={{ flex: 1 }} />
          <PermissionGate object="leave_adjustment" action="add">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setManualAdjModalOpen(true)}
            >
              Manual Adjust
            </Button>
          </PermissionGate>
          <PermissionGate object="leave_adjustment" action="add">
            <Button
              icon={<UploadOutlined />}
              onClick={() => setBulkAdjModalOpen(true)}
            >
              Bulk Adjust
            </Button>
          </PermissionGate>
          <PermissionGate object="leave_comp_off" action="add">
            <Button
              icon={<GiftOutlined />}
              onClick={() => setCompOffCreditModalOpen(true)}
            >
              Credit Comp-Off
            </Button>
          </PermissionGate>
        </div>

        {/* Top: Balance Summary + Ledger History */}
        <div className={styles.ledgerTopGrid}>
          <div className={styles.ledgerCard}>
            <div className={styles.ledgerCardHeader}>
              <span className={styles.ledgerCardTitle}>
                Balance Summary{ledgerEmployeeLabel ? ` — ${ledgerEmployeeLabel}` : ""}
              </span>
            </div>
            <div className={styles.ledgerCardBody}>
              <PermissionGate object="leave_balance" action="view">
                <BalanceSummaryTable
                  balances={
                    ledgerLeaveTypeFilter
                      ? balanceSummary.filter(
                          (b) => b.leaveTypeCode === ledgerLeaveTypeFilter,
                        )
                      : balanceSummary
                  }
                  loading={balanceSummaryLoading}
                  selectedEmployeeId={ledgerEmployeeId}
                  onRowClick={(empId) => setLedgerEmployeeId(empId)}
                />
              </PermissionGate>
            </div>
          </div>
          <div className={styles.ledgerCard}>
            <div className={styles.ledgerCardHeader}>
              <span className={styles.ledgerCardTitle}>
                Ledger History{ledgerEmployeeLabel ? ` — ${ledgerEmployeeLabel}` : ""}
              </span>
            </div>
            <div className={styles.ledgerCardBody}>
              {!ledgerEmployeeId && !ledgerDeptFilter ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="secondary">
                      Pick an employee or department from the toolbar to view ledger entries.
                    </Text>
                  }
                  style={{ padding: "32px 0" }}
                />
              ) : (
                <LedgerHistoryTable entries={ledgerHistory} loading={ledgerLoading} />
              )}
            </div>
          </div>
        </div>

        <PermissionGate object="leave_adjustment" action="add">
          <Modal
            title="Manual Adjustment"
            open={manualAdjModalOpen}
            onCancel={() => setManualAdjModalOpen(false)}
            footer={null}
            destroyOnHidden
            width={560}
          >
            <ManualAdjustmentForm
              organizationId={organizationId}
              onAdjusted={() => {
                loadLedgerHistory();
                setManualAdjModalOpen(false);
              }}
            />
          </Modal>
        </PermissionGate>

        <PermissionGate object="leave_adjustment" action="add">
          <Modal
            title="Bulk Adjustment"
            open={bulkAdjModalOpen}
            onCancel={() => setBulkAdjModalOpen(false)}
            footer={null}
            destroyOnHidden
            width={720}
          >
            <BulkAdjustmentForm
              organizationId={organizationId}
              onAdjusted={() => {
                loadLedgerHistory();
                setBulkAdjModalOpen(false);
              }}
            />
          </Modal>
        </PermissionGate>

        <PermissionGate object="leave_comp_off" action="add">
          <Modal
            title="Credit Comp-Off (Direct)"
            open={compOffCreditModalOpen}
            onCancel={() => setCompOffCreditModalOpen(false)}
            footer={null}
            destroyOnHidden
            width={560}
          >
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
              For workflow-based comp-off, employees submit claims from their dashboard.
            </Text>
            <CompOffCreditForm
              organizationId={organizationId}
              onCredited={() => {
                loadLedgerHistory();
                setCompOffCreditModalOpen(false);
              }}
            />
          </Modal>
        </PermissionGate>
      </div>
    </PermissionGate>
  );

  // ── Tab: Team History (hierarchy-scoped, item 13/14) ──────────────
  // A manager's direct + indirect reports, across all statuses. Distinct
  // from the HR "All Requests" tab; RBAC-gated on the team-calendar object.
  const teamHistoryHierarchyPanel = (
    <PermissionGate object="leave_team_calendar" action="view">
      <TeamHistoryPanel
        organizationId={organizationId}
        managerCode={identity.employeeCode || ""}
        managerHandle={identity.handle || ""}
        requests={globalQueue}
        loading={globalQueueLoading}
        selectedHandle={selectedRequest?.handle}
        onRowClick={setSelectedRequest}
        rightPanel={rightPanel}
        leaveTypeOptions={leaveTypes.map((lt) => ({ value: lt.code, label: `${lt.code} – ${lt.name}` }))}
        employeeOptions={employeeOptions}
      />
    </PermissionGate>
  );

  const accrualPanel = (
    <PermissionGate object="leave_accrual" action="view">
      <AccrualRunPanel organizationId={organizationId} onPosted={() => loadBalanceSummary(balancesYear)} />
    </PermissionGate>
  );

  const policyPanel = (
    <PermissionGate object="leave_policy" action="view">
      <>
        <PolicySettingsTable
          leaveTypes={leaveTypes}
          loading={leaveTypesLoading}
          organizationId={organizationId}
          onRefresh={loadLeaveTypes}
        />
        <BlackoutPeriodPanel />
      </>
    </PermissionGate>
  );

  const yearEndPanel = (
    <PermissionGate object="leave_year_end" action="view">
      <YearEndOperationsPanel
        organizationId={organizationId}
        onProcessed={() => loadBalanceSummary(balancesYear)}
      />
    </PermissionGate>
  );

  const payrollPanel = (
    <PermissionGate object="leave_payroll_export" action="view">
      <PayrollExportPanel organizationId={organizationId} />
    </PermissionGate>
  );

  const reportsPanel = (
    <PermissionGate object="leave_report" action="view">
      <LeaveAvailedReportPanel organizationId={organizationId} />
    </PermissionGate>
  );

  const registerPanel = (
    <PermissionGate object="leave_report" action="view">
      <LeaveRegisterPanel organizationId={organizationId} />
    </PermissionGate>
  );

  const approvalConfigPanel = (
    <PermissionGate object="leave_approval_config" action="view">
      <ApprovalConfigPanel organizationId={organizationId} />
    </PermissionGate>
  );

  const analyticsPanel = (
    <PermissionGate object="leave_report" action="view">
      <LeaveAnalyticsPanel organizationId={organizationId} />
    </PermissionGate>
  );

  // ── Unified permission-driven tab list ────────────────────────────
  const tabItems = [
    permissions.canViewRequests && { key: "requests", label: "My Requests", children: requestsTab },
    permissions.canViewApprovalQueue && { key: "approvals", label: `Approvals (${approverFiltered.length})`, children: approvalTab },
    permissions.canViewHrQueue && { key: "teamHistory", label: isHrAdmin ? "All Requests" : "Team Requests", children: teamHistoryTab },
    permissions.canEditCompOff && { key: "compOffInbox", label: compOffLabel, children: compOffInboxTab },
    permissions.canViewCompOff && { key: "compOff", label: "My Comp-Off", children: compOffTab },
    permissions.canViewTeamCalendar && { key: "teamCalendar", label: "Team Calendar", children: teamCalendarTab },
    permissions.canViewLedger && { key: "ledger", label: "Ledger & Balances", children: ledgerPanel },
    permissions.canViewTeamCalendar && { key: "teamHistoryHierarchy", label: "Team History", children: teamHistoryHierarchyPanel },
    permissions.canViewPolicy && { key: "policy", label: "Policy", children: policyPanel },
    permissions.canViewAccrual && { key: "accrual", label: "Accruals", children: accrualPanel },
    permissions.canViewReports && { key: "reports", label: "Reports", children: reportsPanel },
    permissions.canViewReports && { key: "register", label: "Leave Register", children: registerPanel },
    permissions.canViewReports && { key: "analytics", label: "Analytics", children: analyticsPanel },
    permissions.canViewYearEnd && { key: "yearEnd", label: "Year-End", children: yearEndPanel },
    permissions.canViewPayrollExport && { key: "payroll", label: "Payroll Export", children: payrollPanel },
    permissions.canViewApprovalConfig && { key: "approvalConfig", label: "Approval Config", children: approvalConfigPanel },
  ].filter(Boolean);

  const appTitle = isHrAdmin ? "Leave Management — HR Console" : "Leave Management";

  return (
    <ModuleAccessGate moduleCode="HRM_LEAVE" appTitle={appTitle}>
      <div className={`hrm-module-root ${styles.landing}`}>
        <CommonAppBar appTitle={appTitle} />
        <PermissionGate object="leave_balance" action="view">
          <EmployeeDashboard
            balances={balances}
            year={balancesYear}
            onYearChange={setBalancesYear}
            onApplyLeave={permissions.canApply ? () => openLeaveForm() : undefined}
            loading={balancesLoading}
          />
        </PermissionGate>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
          tabBarExtraContent={
            <Tooltip title="Refresh this tab and balances">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadBalances();
                  refreshActiveTab(activeTab);
                }}
              >
                Refresh
              </Button>
            </Tooltip>
          }
          style={{ flex: 1, overflow: "hidden" }}
        />
        {showLeaveForm && permissions.canApply && (
          <LeaveRequestFormDrawer
            organizationId={organizationId}
            employeeId={employeeId}
            balances={balances}
            allowEmployeeSelection={isHrAdmin}
            onSubmitted={() => {
              loadMyRequests();
              loadBalances();
              if (permissions.canViewHrQueue) loadGlobalQueue();
            }}
          />
        )}
        {showCompOffForm && permissions.canAddCompOff && (
          <CompOffRequestForm onSubmitted={loadMyCompOffRequests} />
        )}
      </div>
    </ModuleAccessGate>
  );
};

export default HrmLeaveLanding;
