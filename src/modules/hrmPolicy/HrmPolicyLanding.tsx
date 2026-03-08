"use client";

import React, { useEffect } from "react";
import { Tabs, message } from "antd";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmPolicyStore } from "./stores/hrmPolicyStore";
import { HrmPolicyService } from "./services/hrmPolicyService";
import { useHrmPolicyData } from "./hooks/useHrmPolicyData";
import PolicyLibraryTemplate from "./components/templates/PolicyLibraryTemplate";
import PolicyAdminTemplate from "./components/templates/PolicyAdminTemplate";
import HrmPolicyScreen from "./HrmPolicyScreen";
import { PolicyDocument } from "./types/domain.types";
import { POLICY_HR_ROLES } from "./utils/constants";
import styles from "./styles/PolicyLanding.module.css";

const HrmPolicyLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "RITS";
  const role = cookies.userRole ?? "EMPLOYEE";
  const canAdmin = POLICY_HR_ROLES.includes(role);

  const {
    policies,
    policiesLoading,
    categories,
    adminPolicies,
    adminPoliciesLoading,
    selectedPolicy,
    showPolicyViewer,
    showFormDrawer,
    editPolicy,
    activeTab,
    viewMode,
    searchText,
    filterCategoryId,
    filterDocType,
    filterStatus,
    publishing,
    archiving,
    setActiveTab,
    setViewMode,
    openPolicyViewer,
    closePolicyViewer,
    openFormDrawer,
    closeFormDrawer,
    setSearchText,
    setFilterCategoryId,
    setFilterDocType,
    setFilterStatus,
    setPublishing,
    setArchiving,
  } = useHrmPolicyStore();

  const { loadCategories, loadPolicies, loadAdminPolicies } = useHrmPolicyData();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [filterCategoryId, filterDocType, filterStatus, searchText]);

  useEffect(() => {
    if (activeTab === "admin" && canAdmin) {
      loadAdminPolicies();
    }
  }, [activeTab]);

  const handlePublish = async (policyHandle: string) => {
    setPublishing(true);
    try {
      const user = cookies.userId ?? "system";
      await HrmPolicyService.publishPolicy({ site, policyHandle, publishedBy: user });
      message.success("Policy published");
      loadAdminPolicies();
    } catch {
      message.error("Failed to publish policy");
    } finally {
      setPublishing(false);
    }
  };

  const handleArchive = async (policyHandle: string) => {
    setArchiving(true);
    try {
      const user = cookies.userId ?? "system";
      await HrmPolicyService.retirePolicy({ site, policyHandle, retiredBy: user, reason: "Retired by admin" });
      message.success("Policy retired");
      loadAdminPolicies();
    } catch {
      message.error("Failed to retire policy");
    } finally {
      setArchiving(false);
    }
  };

  const handleAdminDrawerSaved = () => {
    closeFormDrawer();
    loadAdminPolicies();
    loadPolicies();
  };

  if (showPolicyViewer && selectedPolicy) {
    return (
      <div className={styles.landing}>
        <CommonAppBar appTitle={`HR Policies > ${selectedPolicy.title}`}  />
        <HrmPolicyScreen policy={selectedPolicy} onBack={closePolicyViewer} />
      </div>
    );
  }

  const tabItems = [
    {
      key: "library",
      label: "Policy Library",
      children: (
        <PolicyLibraryTemplate
          policies={policies}
          categories={categories}
          loading={policiesLoading}
          viewMode={viewMode}
          filterCategoryId={filterCategoryId}
          filterDocType={filterDocType}
          filterStatus={filterStatus}
          searchText={searchText}
          canAdmin={canAdmin}
          onPolicyClick={openPolicyViewer}
          onViewModeChange={setViewMode}
          onSearch={setSearchText}
          onCategoryFilter={setFilterCategoryId}
          onDocTypeFilter={setFilterDocType}
          onStatusFilter={setFilterStatus}
          onCreatePolicy={() => openFormDrawer()}
        />
      ),
    },
  ];

  if (canAdmin) {
    tabItems.push({
      key: "admin",
      label: "Admin",
      children: (
        <PolicyAdminTemplate
          policies={adminPolicies}
          categories={categories}
          loading={adminPoliciesLoading}
          showFormDrawer={showFormDrawer}
          editPolicy={editPolicy}
          site={site}
          onEdit={(policy: PolicyDocument) => openFormDrawer(policy)}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onViewDetail={openPolicyViewer}
          onCreateNew={() => openFormDrawer()}
          onDrawerClose={closeFormDrawer}
          onDrawerSaved={handleAdminDrawerSaved}
        />
      ),
    });
  }

  return (
    <div className={styles.landing}>
      <CommonAppBar appTitle="HR Policies & SOPs"  />
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "library" | "admin")}
        items={tabItems}
        size="small"
        tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
        style={{ flex: 1, overflow: "hidden" }}
      />
    </div>
  );
};

export default HrmPolicyLanding;
