'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Tabs, Button, Badge, Spin, Segmented, Empty, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmAssetStore } from './stores/hrmAssetStore';
import { useHrmAssetData } from './hooks/useHrmAssetData';
import { useHrmAssetUI } from './hooks/useHrmAssetUI';
import AssetDashboardHeader from './components/organisms/AssetDashboardHeader';
import AssetSearchBar from './components/molecules/AssetSearchBar';
import AssetMasterList from './components/organisms/AssetMasterList';
import AssetRequestCard from './components/molecules/AssetRequestCard';
import AssetRequestDetail from './components/organisms/AssetRequestDetail';
import AssetRequestEditDrawer from './components/organisms/AssetRequestEditDrawer';
import AllocationPanel from './components/organisms/AllocationPanel';
import AssetForm from './components/organisms/AssetForm';
import AssetCategoryForm from './components/organisms/AssetCategoryForm';
import AssetRequestForm from './components/organisms/AssetRequestForm';
import AssetMasterDetailTemplate from './components/templates/AssetMasterDetailTemplate';
import AssetTeamHistoryTab from './components/organisms/AssetTeamHistoryTab';
import HrmAssetScreen from './HrmAssetScreen';
import type { Asset, AssetRequest } from './types/domain.types';
import { useCan } from '../hrmAccess/hooks/useCan';
import { useEmployeeIdentity } from '../hrmAccess/hooks/useEmployeeIdentity';
import Can from '../hrmAccess/components/Can';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import { useHrmRbacStore } from '../hrmAccess/stores/hrmRbacStore';
import styles from './styles/HrmAsset.module.css';

const HrmAssetLanding: React.FC = () => {
  const store = useHrmAssetStore();
  const data = useHrmAssetData();
  const ui = useHrmAssetUI();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<import('./types/domain.types').AssetCategory | null>(null);
  // Left-list view for the Requests & Approvals master-detail: the user's own
  // requests, or — for approvers — the pending approval queues.
  const [requestView, setRequestView] = useState<'mine' | 'approvals'>('mine');
  const [approvalQueue, setApprovalQueue] = useState<'supervisor' | 'admin' | 'allocation'>('supervisor');

  // RBAC — Object-level permissions for fine-grained access control.
  // UI-level gating uses <Can object="..."> so permissions flow from
  // the section cache loaded by ModuleAccessGate.
  //
  // Object → matrix role mapping:
  //   asset_record       VIEW → Assets tab (Admin)
  //   asset_request      ADD  → create requests (Admin, RM, Employee)
  //   asset_approval          → Reporting Manager tier: sees + acts on the
  //                             FIRST approval step only (Pending Supervisor).
  //   asset_all_approval      → Admin tier: sees ALL three approval steps
  //                             (Supervisor, Admin, Allocation) and acts on
  //                             the Admin + Allocation steps.
  const assetPerms = useCan('HRM_ASSET', 'asset_record');
  const approvalPerms = useCan('HRM_ASSET', 'asset_approval');        // reporting manager
  const allApprovalPerms = useCan('HRM_ASSET', 'asset_all_approval'); // admin
  // Team History — supervisor view of the team's assets. Tab is shown only when
  // the user holds the asset_team_history VIEW grant.
  const teamHistoryPerms = useCan('HRM_ASSET', 'asset_team_history');
  const canViewTeamHistory = teamHistoryPerms.canView;
  const canViewAssets = assetPerms.canView;
  // Signed-in employee — used to load the "My Assets" (allocated-to-me) list
  // for non-admins, who don't have the full-register asset_record grant.
  const identity = useEmployeeIdentity();
  // Whether RBAC has finished resolving for this module. Until the section
  // cache loads, every useCan() returns EMPTY (canView=false), so we must NOT
  // act on a "false" permission yet — otherwise the default-tab redirect below
  // strands even an Admin on Requests during the initial load window.
  const rbacResolved = useHrmRbacStore(
    s => s.isReady && s.sectionPermissionCache['HRM_ASSET'] !== undefined,
  );
  // Tab VISIBILITY (view): supervisor step shows for either grant; the admin +
  // allocation steps show only for the all-approval (admin) grant.
  const canSeeAllApprovalTabs = allApprovalPerms.canView;
  const canViewApprovals = approvalPerms.canView || canSeeAllApprovalTabs;
  // ACTION gating, passed to the approval panel:
  //   isAdmin       → act on the Admin + Allocation steps.
  //   isSupervisor  → act on the Supervisor step (admin is a superset).
  const isAdmin = allApprovalPerms.canEdit || allApprovalPerms.canDelete;
  const isSupervisor = approvalPerms.canEdit || isAdmin;

  // Everyone with module access can submit/track their own requests, and the
  // request form needs the category list — load these once on mount.
  useEffect(() => {
    data.loadCategories();
    data.loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Asset inventory + dashboard are Admin-only (asset_record VIEW). Perms are
  // EMPTY until the section cache loads (ModuleAccessGate lives inside this
  // tree), so key this off canViewAssets — it flips false→true once the cache
  // resolves, and stays false for RM/Employee so no forbidden calls fire.
  useEffect(() => {
    if (canViewAssets) {
      data.loadDashboard();
      data.loadAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAssets]);

  // "My Assets" — non-admins (no full-register grant) load only the assets
  // allocated to them. Gated on rbacResolved so we don't fire before we know
  // the user isn't an admin, and on identity so we have an employeeCode.
  useEffect(() => {
    if (rbacResolved && !canViewAssets && identity.isReady && identity.employeeCode) {
      data.loadAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rbacResolved, canViewAssets, identity.isReady, identity.employeeCode]);

  // Approval inbox data only for users who can view approvals (Admin, RM).
  useEffect(() => {
    if (canViewApprovals) {
      data.loadPendingApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewApprovals]);

  // Refresh requests/approvals when switching to that tab
  const activeTab = store.activeTab;
  useEffect(() => {
    if (activeTab === 'requests') {
      data.loadMyRequests();
      if (canViewApprovals) {
        data.loadPendingApprovals();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Team History is loaded lazily — only when the user opens the tab and only
  // if they hold the permission (so no forbidden /asset/retrieveAll?supervisor
  // call fires for users without the grant).
  useEffect(() => {
    if (activeTab === 'teamHistory' && canViewTeamHistory) {
      data.loadTeamHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, canViewTeamHistory]);

  // Load asset detail data when selecting an asset
  const selectedAssetId = store.selectedAsset?.assetId;
  useEffect(() => {
    if (selectedAssetId) {
      data.loadAssetDetail(selectedAssetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssetId]);

  // Reload button (next to "Add Asset") — refresh EVERYTHING the user can see:
  // dashboard tiles, asset inventory, categories, own requests, and (for
  // approvers) the pending-approval queues.
  const handleReloadAll = () => {
    data.loadCategories();
    data.loadMyRequests();
    // Assets list refreshes for everyone — loadAssets scopes itself (full
    // register for admins, allocated-to-me for employees). Dashboard tiles are
    // admin-only.
    data.loadAssets();
    if (canViewAssets) {
      data.loadDashboard();
    }
    if (canViewApprovals) {
      data.loadPendingApprovals();
    }
  };

  // ── ASSETS TAB ───────────────────────────────────────────────────────────

  const assetsTabContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
        }}
      >
        <AssetSearchBar
          searchQuery={store.searchQuery}
          filterCategory={store.filterCategory}
          filterStatus={store.filterStatus}
          filterLocation={store.filterLocation}
          categories={store.categories}
          onSearchChange={store.setSearchQuery}
          onCategoryChange={store.setFilterCategory}
          onStatusChange={store.setFilterStatus}
          onLocationChange={store.setFilterLocation}
          onClear={store.clearFilters}
        />
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Can I="view" object="asset_category">
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={() => { setEditingCategory(null); setCategoryFormOpen(true); }}
            >
              Categories
            </Button>
          </Can>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReloadAll}
          />
          <Can I="add" object="asset_record">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => { store.setSelectedAsset(null); store.openAssetForm(); }}
            >
              Add Asset
            </Button>
          </Can>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AssetMasterDetailTemplate
          leftPanel={
            <AssetMasterList
              assets={ui.filteredAssets}
              loading={store.loadingAssets}
              selectedAssetId={store.selectedAsset?.assetId}
              onSelect={(asset: Asset) => store.setSelectedAsset(asset)}
            />
          }
          rightPanel={store.selectedAsset ? <HrmAssetScreen /> : null}
        />
      </div>
    </div>
  );

  // ── REQUESTS & APPROVALS TAB ──────────────────────────────────────────

  // Open a request in the right-hand detail panel, hydrating the full record
  // (complete approval history) via /asset/request/retrieve.
  const handleSelectRequest = (req: AssetRequest) => {
    store.setSelectedRequest(req);
    data.loadRequestDetail(req.requestId);
  };

  // Re-pull the lists + the open detail after any state-changing action
  // (approve / reject / move / escalate / edit / cancel / allocate) so the
  // UI reflects the request's new status without a manual reload.
  const refreshRequests = useCallback(() => {
    data.loadMyRequests();
    if (canViewApprovals) data.loadPendingApprovals();
    const sel = store.selectedRequest;
    if (sel) data.loadRequestDetail(sel.requestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewApprovals, store.selectedRequest]);

  const handleAllocate = (req: AssetRequest) => {
    store.setSelectedRequest(req);
    store.openAllocationPanel();
  };

  // Approval queues — only surface a tab that the user's role permits AND that
  // actually has pending items (so e.g. an admin who is nobody's reporting
  // manager doesn't see an empty "Supervisor" tab).
  const queueDefs: { key: 'supervisor' | 'admin' | 'allocation'; label: string; list: AssetRequest[] }[] = [
    { key: 'supervisor', label: 'Supervisor', list: store.pendingSupervisorRequests },
    ...(canSeeAllApprovalTabs
      ? ([
          { key: 'admin' as const, label: 'Admin', list: store.pendingAdminRequests },
          { key: 'allocation' as const, label: 'Allocation', list: store.pendingAllocationRequests },
        ])
      : []),
  ];
  const visibleQueues = queueDefs.filter((q) => q.list.length > 0);
  // Keep the selected queue valid as counts change after an action.
  const effectiveQueue =
    visibleQueues.find((q) => q.key === approvalQueue)?.key ?? visibleQueues[0]?.key ?? 'supervisor';

  // Which list backs the left panel right now.
  const leftListRequests: AssetRequest[] =
    requestView === 'mine'
      ? store.myRequests
      : (visibleQueues.find((q) => q.key === effectiveQueue)?.list ?? []);

  const requestsLeftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {canViewApprovals ? (
            <Segmented
              size="small"
              value={requestView}
              onChange={(v) => setRequestView(v as 'mine' | 'approvals')}
              options={[
                { label: 'My Requests', value: 'mine' },
                { label: `Approvals (${ui.approvalsBadgeCount})`, value: 'approvals' },
              ]}
            />
          ) : (
            <span style={{ fontWeight: 600, fontSize: 13, color: '#262626' }}>My Requests</span>
          )}
          <Can I="add" object="asset_request" passIf>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={store.openRequestForm}>
              New
            </Button>
          </Can>
        </div>
        {canViewApprovals && requestView === 'approvals' && visibleQueues.length > 0 && (
          <Segmented
            size="small"
            block
            value={effectiveQueue}
            onChange={(v) => setApprovalQueue(v as 'supervisor' | 'admin' | 'allocation')}
            options={visibleQueues.map((q) => ({ label: `${q.label} (${q.list.length})`, value: q.key }))}
          />
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {store.loadingRequests ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : leftListRequests.length === 0 ? (
          <Empty
            description={requestView === 'mine' ? 'No requests yet' : 'Nothing pending here'}
            style={{ marginTop: 40 }}
          />
        ) : (
          leftListRequests.map((req) => (
            <AssetRequestCard
              key={req.requestId}
              request={req}
              isSelected={store.selectedRequest?.requestId === req.requestId}
              onClick={handleSelectRequest}
            />
          ))
        )}
      </div>
    </div>
  );

  const requestsRightPanel = store.selectedRequest ? (
    <AssetRequestDetail
      request={store.requestDetail ?? store.selectedRequest}
      loading={store.loadingRequestDetail}
      isSupervisor={isSupervisor}
      isAdmin={isAdmin}
      onActionComplete={refreshRequests}
      onEdit={(req) => store.openEditRequestDrawer(req)}
      onAllocate={handleAllocate}
      onDecided={() => store.setSelectedRequest(null)}
    />
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography.Text type="secondary">Select a request to view its details and timeline</Typography.Text>
    </div>
  );

  const requestsTabContent = (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <AssetMasterDetailTemplate leftPanel={requestsLeftPanel} rightPanel={requestsRightPanel} />
    </div>
  );

  const tabItems = [
    // Assets tab — admins see the full register ("Assets"); everyone else sees
    // their own allocated assets ("My Assets"). The list data is scoped in
    // loadAssets; admin-only controls (Add Asset, Categories) stay <Can>-gated.
    {
      key: 'assets',
      // Admin → full register ("Assets"); everyone else → their own allocated
      // assets ("My Assets"). The list is role-filtered server-side via the
      // employeeId sent to /asset/retrieveAll.
      label: canViewAssets ? 'Assets' : 'My Assets',
      children: assetsTabContent,
    },
    {
      key: 'requests',
      label: (
        <Badge count={ui.approvalsBadgeCount + ui.requestsBadgeCount} size="small" offset={[6, 0]}>
          Requests & Approvals
        </Badge>
      ),
      children: requestsTabContent,
    },
    // Team History — supervisor-only view of the team's assets. Visible solely
    // when the asset_team_history VIEW grant is present.
    ...(canViewTeamHistory
      ? [{
          key: 'teamHistory',
          label: 'Team History',
          children: <AssetTeamHistoryTab onReload={data.loadTeamHistory} />,
        }]
      : []),
  ];

  // Never point Tabs at a hidden key (e.g. 'assets' for a user without access,
  // before the redirect effect runs) — fall back to the first visible tab.
  const visibleTabKeys = tabItems.map((t) => t.key);
  const activeTabKey = visibleTabKeys.includes(store.activeTab)
    ? store.activeTab
    : visibleTabKeys[0];

  return (
    <ModuleAccessGate moduleCode="HRM_ASSET" appTitle="Asset Management">
    <div className={`hrm-module-root ${styles.assetRoot}`}>
      <CommonAppBar appTitle="Asset Management" />
      {canViewAssets && (store.dashboard || store.loadingDashboard) && (
        <AssetDashboardHeader dashboard={store.dashboard!} loading={store.loadingDashboard} />
      )}
      <div className={`${styles.assetContent} ${styles.tabsWrapper}`}>
        <Tabs
          activeKey={activeTabKey}
          onChange={(k) => store.setActiveTab(k as 'assets' | 'requests' | 'teamHistory')}
          items={tabItems}
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
          style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
          destroyOnHidden={false}
        />
      </div>

      {store.isAssetFormOpen && (
        <AssetForm editAsset={store.selectedAsset} />
      )}
      {store.isRequestFormOpen && <AssetRequestForm />}
      {/* Edit drawer + allocation panel are mounted here so they work on the
          Requests & Approvals tab. Previously AllocationPanel was only mounted
          inside HrmAssetScreen (the Assets tab), so the "Allocate Asset" button
          in the approval flow opened nothing. */}
      <AssetRequestEditDrawer onSaved={refreshRequests} />
      {store.isAllocationPanelOpen && <AllocationPanel onAllocated={refreshRequests} />}

      <AssetCategoryForm
        open={categoryFormOpen}
        onClose={() => { setCategoryFormOpen(false); setEditingCategory(null); }}
        editCategory={editingCategory}
        onEditCategory={(cat) => setEditingCategory(cat)}
      />
    </div>
    </ModuleAccessGate>
  );
};

export default HrmAssetLanding;
