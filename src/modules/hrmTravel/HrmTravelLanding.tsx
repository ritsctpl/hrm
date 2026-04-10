"use client";

import React, { useEffect, useCallback } from "react";
import { Button, Tabs, Typography, Space } from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import { parseCookies } from "nookies";
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
import HrmTravelScreen from "./HrmTravelScreen";
import Can from "../hrmAccess/components/Can";
import ModuleAccessGate from "../hrmAccess/components/ModuleAccessGate";
import styles from "./styles/Travel.module.css";

const { Text } = Typography;

const SUPERVISOR_ROLES = ["SUPERVISOR", "NEXT_SUPERIOR", "MANAGER"];
const ADMIN_ROLES = ["ADMIN", "HR", "SUPERADMIN"];

const HrmTravelLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const role = cookies.userRole ?? "EMPLOYEE";

  const {
    myRequests,
    listLoading,
    approverInbox,
    inboxLoading,
    selectedRequest,
    screenMode,
    policies,
    statusFilter,
    typeFilter,
    dateRange,
    setSelectedRequest,
    setScreenMode,
    resetFormState,
  } = useHrmTravelStore();

  const { loadMyRequests, loadApproverInbox, loadPolicies, exportRequests } = useTravelData();

  const isSupervisor = SUPERVISOR_ROLES.includes(role);
  const isAdmin = ADMIN_ROLES.includes(role);

  // Load data on mount and when filters change
  useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests, statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    if (isSupervisor || isAdmin) {
      loadApproverInbox();
    }
  }, [isSupervisor, isAdmin, loadApproverInbox]);

  useEffect(() => {
    if (isAdmin) {
      loadPolicies();
    }
  }, [isAdmin, loadPolicies]);

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
    if (isSupervisor || isAdmin) loadApproverInbox();
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
            <Can I="add">
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

  // Employee only sees their requests
  if (!isSupervisor && !isAdmin) {
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

  const pendingRequests = approverInbox.filter((r) => r.status === "PENDING_APPROVAL" || r.status === "ESCALATED" && r.escalationLevel === 0);
  const escalatedRequests = approverInbox.filter((r) => r.status === "ESCALATED");
  const decidedRequests = approverInbox.filter((r) => !["PENDING_APPROVAL", "ESCALATED"].includes(r.status));

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

  const tabItems = [
    { key: "myRequests", label: "My Requests", children: myRequestsTab },
    {
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
    },
  ];

  if (isAdmin) {
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
