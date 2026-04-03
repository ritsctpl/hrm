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
import PolicyFormDrawer from "./components/organisms/PolicyFormDrawer";
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
    selectedPolicyLoading,
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
    setSelectedPolicy,
    setSelectedPolicyLoading,
  } = useHrmPolicyStore();

  const { loadCategories, loadPolicies, loadAdminPolicies } = useHrmPolicyData();

  // Fetch full policy details when opening viewer
  const handlePolicyClick = async (policy: PolicyDocument) => {
    openPolicyViewer(policy); // Show viewer with basic data first
    try {
      const fullPolicy = await HrmPolicyService.getPolicyDetail({ 
        site, 
        policyHandle: policy.handle 
      });
      setSelectedPolicy(fullPolicy); // Update with full data including pdfBase64
    } catch (error) {
      message.error("Failed to load policy details");
      console.error("Error loading policy details:", error);
    } finally {
      setSelectedPolicyLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPolicies();
  }, [filterCategoryId, filterDocType, filterStatus]);

  useEffect(() => {
    if (activeTab === "admin" && canAdmin) {
      loadAdminPolicies();
    }
  }, [activeTab, filterCategoryId, filterDocType, filterStatus]);

  const handlePublish = async (policyHandle: string) => {
    setPublishing(true);
    try {
      const user = cookies.userId ?? "system";
      
      // Find the policy to check its status
      const policy = adminPolicies.find(p => p.handle === policyHandle);
      
      if (!policy) {
        message.error("Policy not found");
        return;
      }
      
      // Workflow: DRAFT → submitForReview → REVIEW → approve → APPROVED → publish → PUBLISHED
      if (policy.status === "DRAFT") {
        await HrmPolicyService.submitForReview({ 
          site, 
          policyHandle, 
          submittedBy: user 
        });
        message.success("Policy submitted for review");
      } else if (policy.status === "REVIEW") {
        await HrmPolicyService.approvePolicy({ 
          site, 
          policyHandle, 
          approvedBy: user 
        });
        message.success("Policy approved successfully");
      } else if (policy.status === "APPROVED") {
        await HrmPolicyService.publishPolicy({ 
          site, 
          policyHandle, 
          publishedBy: user 
        });
        message.success("Policy published successfully");
      } else {
        message.warning(`Cannot process policy with status: ${policy.status}`);
      }
      
      loadAdminPolicies();
    } catch (error: any) {
      console.error("Policy workflow error:", error);
      
      // Extract error message
      let errorMessage = "Failed to process policy";
      if (error?.response?.data?.message_details?.msg) {
        errorMessage = error.response.data.message_details.msg;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
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
      <div className={`hrm-module-root ${styles.landing}`}>
        <CommonAppBar appTitle={`HR Policies > ${selectedPolicy.title}`}  />
        <HrmPolicyScreen policy={selectedPolicy} loading={selectedPolicyLoading} onBack={closePolicyViewer} />
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
          onPolicyClick={handlePolicyClick}
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
          searchText={searchText}
          filterCategoryId={filterCategoryId}
          filterDocType={filterDocType}
          filterStatus={filterStatus}
          onEdit={(policy: PolicyDocument) => openFormDrawer(policy)}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onViewDetail={handlePolicyClick}
          onCreateNew={() => openFormDrawer()}
          onDrawerClose={closeFormDrawer}
          onDrawerSaved={handleAdminDrawerSaved}
          onSearch={setSearchText}
          onCategoryFilter={setFilterCategoryId}
          onDocTypeFilter={setFilterDocType}
          onStatusFilter={setFilterStatus}
        />
      ),
    });
  }

  return (
    <div className={`hrm-module-root ${styles.landing}`}>
      <CommonAppBar appTitle="HR Policies & SOPs"  />
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "library" | "admin")}
        items={tabItems}
        size="small"
        tabBarStyle={{ 
          marginBottom: 0, 
          padding: '0 16px', 
          borderBottom: '1px solid #e8e8e8',
          flexShrink: 0 
        }}
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden'
        }}
        className="policy-tabs-container"
      />
      
      {/* Form Drawer - render at landing level so it works from both tabs */}
      <PolicyFormDrawer
        open={showFormDrawer}
        editPolicy={editPolicy}
        categories={categories}
        site={site}
        onClose={closeFormDrawer}
        onSaved={handleAdminDrawerSaved}
      />
    </div>
  );
};

export default HrmPolicyLanding;
