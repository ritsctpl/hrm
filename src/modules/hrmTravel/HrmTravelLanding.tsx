"use client";

import React, { useEffect, useCallback } from "react";
import { Button, Tabs, Typography, Space } from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
import { getOrganizationId } from "@/utils/cookieUtils";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmTravelStore } from "./stores/hrmTravelStore";
import { useTravelData } from "./hooks/useTravelData";
import TravelSearchBar from "./components/molecules/TravelSearchBar";
import TravelListTable from "./components/organisms/TravelListTable";
import ApproverInboxTable from "./components/organisms/ApproverInboxTable";
import TravelPolicyConfig from "./components/organisms/TravelPolicyConfig";
import TravelMasterDetailTemplate from "./components/templates/TravelMasterDetailTemplate";
import TravelApproverTemplate from "./components/templates/TravelApproverTemplate";
import TravelScreenHeader from "./components/organisms/TravelScreenHeader";
import TravelReportScreen from "./components/organisms/TravelReportScreen";
import HrmTravelScreen from "./HrmTravelScreen";
import Can from "../hrmAccess/components/Can";
import ModuleAccessGate from "../hrmAccess/components/ModuleAccessGate";
import { useTravelPermissions } from "./hooks/useTravelPermissions";
import { HrmTravelService } from "./services/hrmTravelService";
import styles from "./styles/Travel.module.css";

const { Text } = Typography;

const SUPERVISOR_ROLES = ["SUPERVISOR", "NEXT_SUPERIOR", "MANAGER"];
const ADMIN_ROLES = ["ADMIN", "HR", "SUPERADMIN"];

const HrmTravelLanding: React.FC = () => {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const cookieRole = (cookies.userRole ?? "EMPLOYEE").toUpperCase();
  const employeeId =
    cookies.employeeId ??
    cookies.employeeCode ??
    cookies.username ??
    cookies.userId ??
    cookies.user ??
    cookies.rl_user_id ??
    "";

  // RBAC-driven role: when backend has published HRM_TRAVEL grants we trust
  // them exclusively; the cookie role is only consulted as a fallback for
  // environments where RBAC isn't wired yet.
  const travelPerms = useTravelPermissions();
  const isAdmin = travelPerms.rbacPublished
    ? travelPerms.isHrAdmin
    : ADMIN_ROLES.includes(cookieRole);
  const isSupervisor = travelPerms.rbacPublished
    ? travelPerms.isSupervisor
    : !isAdmin && SUPERVISOR_ROLES.includes(cookieRole);
  const role = isAdmin ? "HR" : isSupervisor ? "SUPERVISOR" : "EMPLOYEE";

  const {
    myRequests,
    listLoading,
    approverInbox,
    inboxLoading,
    selectedRequest,
    screenMode,
    policies,
    searchTerm,
    statusFilter,
    typeFilter,
    dateRange,
    setSelectedRequest,
    setScreenMode,
    resetFormState,
  } = useHrmTravelStore();

  const { loadMyRequests, loadApproverInbox, loadPolicies, exportRequests } = useTravelData();

  // Tab/data gates derived from RBAC (with cookie fallback already baked into
  // isSupervisor/isAdmin above). When RBAC is published, fall back to the
  // explicit object grants so unrelated module-level perms can't open the
  // wrong queue.
  const canSeeApprovals = travelPerms.rbacPublished
    ? travelPerms.canViewApproval
    : isSupervisor || isAdmin;
  const canSeePolicy = travelPerms.rbacPublished
    ? travelPerms.canManagePolicy
    : isAdmin;
  const canSeeReports = travelPerms.rbacPublished
    ? travelPerms.canViewHistory || travelPerms.canViewApproval
    : isSupervisor || isAdmin;

  // Load data on mount and when filters change
  useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests, statusFilter, typeFilter, dateRange, searchTerm]);

  useEffect(() => {
    if (canSeeApprovals) {
      loadApproverInbox();
    }
  }, [canSeeApprovals, loadApproverInbox]);

  useEffect(() => {
    if (canSeePolicy) {
      loadPolicies();
    }
  }, [canSeePolicy, loadPolicies]);

  const handleNewRequest = () => {
    setSelectedRequest(null);
    resetFormState();
    setScreenMode("create");
  };

  const handleRowClick = useCallback((request: typeof myRequests[0]) => {
    setSelectedRequest(request);
    setScreenMode("view");
  }, []);

  const handleBack = () => {
    setScreenMode("list");
    setSelectedRequest(null);
  };

  const handleActionComplete = () => {
    loadMyRequests();
    if (canSeeApprovals) loadApproverInbox();
    setSelectedRequest(null);
    setScreenMode("list");
  };

  const handleInboxRowClick = useCallback((request: typeof myRequests[0]) => {
    setSelectedRequest(request);
    setScreenMode("view");
  }, []);

  // Build detail panel - passes isApprover based on context
  const buildDetailPanel = (isApproverContext = false) => {
    if (screenMode === "create" || (screenMode !== "list" && selectedRequest)) {
      return (
        <HrmTravelScreen
          request={selectedRequest}
          mode={screenMode === "create" ? "create" : "view"}
          isApprover={isApproverContext && screenMode !== "create"}
          onBack={handleBack}
          onActionComplete={handleActionComplete}
        />
      );
    }
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <span style={{ fontSize: 48 }}>&#9992;</span>
        </div>
        <Text type="secondary">Select a request to view details</Text>
      </div>
    );
  };

  // ── Build list tab content ──────────────────────────────────────────

  const myRequestsTab = (
    <>
      <TravelScreenHeader
        title="My Travel Requests"
        actions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={exportRequests}>
              Export CSV
            </Button>
            <Can I="add" object="travel_request">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleNewRequest}>
                New Request
              </Button>
            </Can>
          </Space>
        }
      />
      <TravelSearchBar onSearch={loadMyRequests} />
      <TravelMasterDetailTemplate
        listPanel={
          <TravelListTable
            requests={myRequests}
            loading={listLoading}
            selectedHandle={selectedRequest?.handle}
            onRowClick={handleRowClick}
            onNewRequest={handleNewRequest}
          />
        }
        detailPanel={buildDetailPanel(false)}
      />
    </>
  );

  // Employee only sees their requests — gate strictly by RBAC visibility of
  // the supervisor / admin surfaces. When neither approval nor policy nor
  // history visibility is granted, fall back to the single-tab employee view.
  if (!canSeeApprovals && !canSeePolicy && !canSeeReports) {
    return (
      <ModuleAccessGate moduleCode="HRM_TRAVEL" appTitle="Travel Requests">
        <div className={`hrm-module-root ${styles.landing}`}>
          <CommonAppBar appTitle="Travel Requests" />
          {myRequestsTab}
        </div>
      </ModuleAccessGate>
    );
  }

  // ── Supervisor / Admin view with tabs ──────────────────────────────────

  const pendingRequests = approverInbox.filter((r) => r.status === "PENDING_APPROVAL");
  const escalatedRequests = approverInbox.filter((r) => r.status === "ESCALATED");
  const decidedRequests = approverInbox.filter(
    (r) => !["PENDING_APPROVAL", "ESCALATED"].includes(r.status),
  );

  const makeInboxPanel = (items: typeof approverInbox) => (
    <TravelMasterDetailTemplate
      listPanel={
        <ApproverInboxTable
          requests={items}
          loading={inboxLoading}
          selectedHandle={selectedRequest?.handle}
          onRowClick={handleInboxRowClick}
        />
      }
      detailPanel={buildDetailPanel(true)}
    />
  );

  const tabItems: { key: string; label: React.ReactNode; children: React.ReactNode }[] = [
    { key: "myRequests", label: "My Requests", children: myRequestsTab },
  ];

  if (canSeeApprovals) {
    tabItems.push({
      key: "approvals",
      label: `Approvals (${pendingRequests.length})`,
      children: (
        <TravelApproverTemplate
          pendingPanel={makeInboxPanel(pendingRequests)}
          escalatedPanel={makeInboxPanel(escalatedRequests)}
          decidedPanel={makeInboxPanel(decidedRequests)}
          pendingCount={pendingRequests.length}
          escalatedCount={escalatedRequests.length}
        />
      ),
    });
  }

  if (canSeeReports) {
    tabItems.push({
      key: "reportPendingAging",
      label: "Pending Aging Report",
      children: (
        <TravelReportScreen
          title="Pending Approval — Aging Report"
          description="Travel requests awaiting approval, with days-since-submission aging."
          organizationId={organizationId}
          empId={employeeId}
          fetcher={(p) =>
            HrmTravelService.reportPendingAging({ organizationId: p.organizationId, empId: p.empId })
          }
        />
      ),
    });
    tabItems.push({
      key: "reportByTypeDate",
      label: "By Type & Date Report",
      children: (
        <TravelReportScreen
          title="Travel Reports by Type & Date"
          description="All travel requests in the selected window, optionally filtered by travel type."
          organizationId={organizationId}
          empId={employeeId}
          fetcher={(p) =>
            HrmTravelService.reportByTypeDate({
              organizationId: p.organizationId,
              fromDate: p.fromDate ?? "",
              toDate: p.toDate ?? "",
              travelType: p.travelType,
            })
          }
          requireDateRange
          showTypeFilter
        />
      ),
    });
  }

  if (canSeePolicy) {
    tabItems.push({
      key: "policyConfig",
      label: "Travel Policy",
      children: (
        <div style={{ padding: 16 }}>
          <TravelPolicyConfig policies={policies} onSaved={loadPolicies} />
        </div>
      ),
    });
  }

  return (
    <ModuleAccessGate moduleCode="HRM_TRAVEL" appTitle="Travel Requests">
      <div className={`hrm-module-root ${styles.landing}`}>
        <CommonAppBar appTitle="Travel Requests" />
        <Tabs items={tabItems} size="small" tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }} style={{ flex: 1, overflow: "hidden" }} />
      </div>
    </ModuleAccessGate>
  );
};

export default HrmTravelLanding;
