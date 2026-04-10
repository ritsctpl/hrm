"use client";

import React, { useEffect } from "react";
import { Tabs, message } from "antd";
import { parseCookies } from "nookies";
import CommonAppBar from "@/components/CommonAppBar";
import { useHrmPolicyStore } from "./stores/hrmPolicyStore";
import { HrmPolicyService } from "./services/hrmPolicyService";
import { useHrmPolicyData } from "./hooks/useHrmPolicyData";
import { usePermissionsStore } from "@/stores/permissionsStore";
import { useCan } from "../hrmAccess/hooks/useCan";
import ModuleAccessGate from "../hrmAccess/components/ModuleAccessGate";
import PolicyLibraryTemplate from "./components/templates/PolicyLibraryTemplate";
import PolicyAdminTemplate from "./components/templates/PolicyAdminTemplate";
import PolicyFormDrawer from "./components/organisms/PolicyFormDrawer";
import SupersedePolicyModal from "./components/organisms/SupersedePolicyModal";
import HrmPolicyScreen from "./HrmPolicyScreen";
import { PolicyDocument } from "./types/domain.types";
import styles from "./styles/PolicyLanding.module.css";

const HrmPolicyLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? "";
  const userId = cookies.rl_user_id ?? "system";  // ← Use rl_user_id instead of userId

  const { fetchEffectivePermissions } = usePermissionsStore();
  const modulePerms = useCan('HRM_POLICY');

  // RBAC is the single source of truth — any CUD requires ADD/EDIT/DELETE
  // action on HRM_POLICY module. No hardcoded-role fallback.
  const canAdminPolicies = modulePerms.canAdd || modulePerms.canEdit || modulePerms.canDelete;

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
    librarySearchText,
    libraryFilterCategoryId,
    libraryFilterDocType,
    adminSearchText,
    adminFilterCategoryId,
    adminFilterDocType,
    adminFilterStatus,
    publishing,
    archiving,
    setActiveTab,
    setViewMode,
    openPolicyViewer,
    closePolicyViewer,
    openFormDrawer,
    closeFormDrawer,
    setLibrarySearchText,
    setLibraryFilterCategoryId,
    setLibraryFilterDocType,
    setAdminSearchText,
    setAdminFilterCategoryId,
    setAdminFilterDocType,
    setAdminFilterStatus,
    setPublishing,
    setArchiving,
    setSelectedPolicy,
    setSelectedPolicyLoading,
    showSupersedeModal,
    openSupersedeModal,
    closeSupersedeModal,
  } = useHrmPolicyStore();

  const { loadCategories, loadPolicies, loadAdminPolicies } = useHrmPolicyData();

  // Fetch effective permissions when module loads
  useEffect(() => {
    fetchEffectivePermissions(site, userId, 'HRM_POLICY');
  }, [site, userId]);

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
  }, [libraryFilterCategoryId, libraryFilterDocType]);

  useEffect(() => {
    if (activeTab === "admin" && canAdminPolicies) {
      loadAdminPolicies();
    }
  }, [activeTab, adminFilterCategoryId, adminFilterDocType, adminFilterStatus, canAdminPolicies]);

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

  const handleDelete = async (policyHandle: string) => {
    try {
      const user = cookies.userId ?? "system";
      await HrmPolicyService.deletePolicy({ site, policyHandle, deletedBy: user });
      message.success("Policy deleted successfully");
      loadAdminPolicies();
      loadPolicies();
    } catch (error: any) {
      let errorMessage = "Failed to delete policy";
      if (error?.response?.data?.message_details?.msg) {
        errorMessage = error.response.data.message_details.msg;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
    }
  };

  const handleSupersede = async (oldPolicyHandle: string, newPolicyHandle: string) => {
    try {
      const user = cookies.userId ?? "system";
      await HrmPolicyService.supersedePolicy({
        site,
        oldPolicyHandle,
        newPolicyHandle,
        updatedBy: user,
      });
      message.success("Policy superseded successfully");
      loadAdminPolicies();
      loadPolicies();
    } catch (error: any) {
      let errorMessage = "Failed to supersede policy";
      if (error?.response?.data?.message_details?.msg) {
        errorMessage = error.response.data.message_details.msg;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
      throw error;
    }
  };

  const handleAdminDrawerSaved = () => {
    closeFormDrawer();
    loadAdminPolicies();
    loadPolicies();
  };

  // Route-level access gate (VIEW + RBAC ready) is handled by <ModuleAccessGate>
  // wrapping every return path below.

  if (showPolicyViewer && selectedPolicy) {
    return (
      <ModuleAccessGate moduleCode="HRM_POLICY" appTitle="HR Policies & SOPs">
        <div className={`hrm-module-root ${styles.landing}`}>
          <CommonAppBar appTitle={`HR Policies > ${selectedPolicy.title}`}  />
          <HrmPolicyScreen policy={selectedPolicy} loading={selectedPolicyLoading} onBack={closePolicyViewer} />
        </div>
      </ModuleAccessGate>
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
          filterCategoryId={libraryFilterCategoryId}
          filterDocType={libraryFilterDocType}
          searchText={librarySearchText}
          canAdmin={modulePerms.canAdd}
          onPolicyClick={handlePolicyClick}
          onViewModeChange={setViewMode}
          onSearch={setLibrarySearchText}
          onCategoryFilter={setLibraryFilterCategoryId}
          onDocTypeFilter={setLibraryFilterDocType}
          onCreatePolicy={() => openFormDrawer()}
        />
      ),
    },
  ];

  // Use RBAC permissions from backend as the ONLY source of truth.
  // Admin tab is only available when user has at least one CUD action.
  if (canAdminPolicies) {
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
          searchText={adminSearchText}
          filterCategoryId={adminFilterCategoryId}
          filterDocType={adminFilterDocType}
          filterStatus={adminFilterStatus}
          onEdit={(policy: PolicyDocument) => openFormDrawer(policy)}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onViewDetail={handlePolicyClick}
          onCreateNew={() => openFormDrawer()}
          onSupersede={openSupersedeModal}
          onDrawerClose={closeFormDrawer}
          onDrawerSaved={handleAdminDrawerSaved}
          onSearch={setAdminSearchText}
          onCategoryFilter={setAdminFilterCategoryId}
          onDocTypeFilter={setAdminFilterDocType}
          onStatusFilter={setAdminFilterStatus}
          onRefresh={loadAdminPolicies}
        />
      ),
    });
  }

  return (
    <ModuleAccessGate moduleCode="HRM_POLICY" appTitle="HR Policies & SOPs">
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

      <SupersedePolicyModal
        open={showSupersedeModal}
        policies={adminPolicies}
        site={site}
        onClose={closeSupersedeModal}
        onSupersede={handleSupersede}
      />
    </div>
    </ModuleAccessGate>
  );
};

export default HrmPolicyLanding;
