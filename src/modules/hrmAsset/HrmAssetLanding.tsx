'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, Button, Badge, Spin } from 'antd';
import { PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmAssetStore } from './stores/hrmAssetStore';
import { useHrmAssetData } from './hooks/useHrmAssetData';
import { useHrmAssetUI } from './hooks/useHrmAssetUI';
import AssetDashboardHeader from './components/organisms/AssetDashboardHeader';
import AssetSearchBar from './components/molecules/AssetSearchBar';
import AssetMasterList from './components/organisms/AssetMasterList';
import AssetRequestCard from './components/molecules/AssetRequestCard';
import ApprovalInbox from './components/organisms/ApprovalInbox';
import AssetForm from './components/organisms/AssetForm';
import AssetCategoryForm from './components/organisms/AssetCategoryForm';
import AssetRequestForm from './components/organisms/AssetRequestForm';
import AssetMasterDetailTemplate from './components/templates/AssetMasterDetailTemplate';
import HrmAssetScreen from './HrmAssetScreen';
import type { Asset, AssetRequest } from './types/domain.types';
import { useCan } from '../hrmAccess/hooks/useCan';
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

  // RBAC — Object-level permissions for fine-grained access control.
  // UI-level gating uses <Can object="..."> so permissions flow from
  // the section cache loaded by ModuleAccessGate.
  //
  // Object → matrix role mapping:
  //   asset_record   VIEW  → Assets tab (Admin)
  //   asset_request  ADD   → create requests (Admin, RM, Employee)
  //   asset_approval VIEW  → Approval Inbox visible (Admin, RM)
  //   asset_approval EDIT  → supervisor-tier approve/reject (RM, Admin)
  //   asset_approval DELETE→ admin-tier approve/reject + allocation (Admin)
  const assetPerms = useCan('HRM_ASSET', 'asset_record');
  const approvalPerms = useCan('HRM_ASSET', 'asset_approval');
  const canViewAssets = assetPerms.canView;
  // Whether RBAC has finished resolving for this module. Until the section
  // cache loads, every useCan() returns EMPTY (canView=false), so we must NOT
  // act on a "false" permission yet — otherwise the default-tab redirect below
  // strands even an Admin on Requests during the initial load window.
  const rbacResolved = useHrmRbacStore(
    s => s.isReady && s.sectionPermissionCache['HRM_ASSET'] !== undefined,
  );
  const canViewApprovals = approvalPerms.canView;
  const isSupervisor = approvalPerms.canEdit; // supervisor-tier approve/reject
  const isAdmin = approvalPerms.canDelete;    // admin-tier approve/reject + allocation

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

  // Approval inbox data only for users who can view approvals (Admin, RM).
  useEffect(() => {
    if (canViewApprovals) {
      data.loadPendingApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewApprovals]);

  // Assets is the default tab (store init = 'assets'). Only redirect to
  // Requests once RBAC has RESOLVED and the user genuinely can't view Assets —
  // never during the initial EMPTY-perms window, or an Admin would be bounced
  // off their default Assets screen.
  useEffect(() => {
    if (rbacResolved && !canViewAssets && store.activeTab === 'assets') {
      store.setActiveTab('requests');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rbacResolved, canViewAssets, store.activeTab]);

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

  // Load asset detail data when selecting an asset
  const selectedAssetId = store.selectedAsset?.assetId;
  useEffect(() => {
    if (selectedAssetId) {
      data.loadAssetDetail(selectedAssetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssetId]);

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
            onClick={data.loadAssets}
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

  const requestsTabContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '8px 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {/* Requests are universal — anyone who can open the module (asset_module
            VIEW, enforced by ModuleAccessGate) may submit one. passIf makes the
            action self-service so it works even before asset_request grants are
            configured, while still honoring an explicit asset_request ADD grant. */}
        <Can I="add" object="asset_request" passIf>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={store.openRequestForm}
          >
            New Request
          </Button>
        </Can>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {/* My Requests Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#262626' }}>
            My Requests
          </div>
          {store.loadingRequests ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
          ) : store.myRequests.length === 0 ? (
            <div style={{ color: '#8c8c8c', padding: 16, textAlign: 'center' }}>
              No requests submitted yet. Click &quot;New Request&quot; to create one.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {store.myRequests.map((req: AssetRequest) => (
                <AssetRequestCard
                  key={req.requestId}
                  request={req}
                  isSelected={store.selectedRequest?.requestId === req.requestId}
                  onClick={(r) => store.setSelectedRequest(r)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Approval Inbox Section — Admin & Reporting Manager only */}
        {canViewApprovals && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#262626' }}>
              Approval Inbox
              {ui.approvalsBadgeCount > 0 && (
                <Badge
                  count={ui.approvalsBadgeCount}
                  size="small"
                  style={{ marginLeft: 8 }}
                />
              )}
            </div>
            <ApprovalInbox
              isSupervisor={isSupervisor}
              isAdmin={isAdmin}
              loading={store.loadingRequests}
            />
          </div>
        )}
      </div>
    </div>
  );

  const tabItems = [
    // Assets tab — Admin only (asset_record VIEW)
    ...(canViewAssets ? [{
      key: 'assets',
      label: 'Assets',
      children: assetsTabContent,
    }] : []),
    {
      key: 'requests',
      label: (
        <Badge count={ui.approvalsBadgeCount + ui.requestsBadgeCount} size="small" offset={[6, 0]}>
          Requests & Approvals
        </Badge>
      ),
      children: requestsTabContent,
    },
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
          onChange={(k) => store.setActiveTab(k as 'assets' | 'requests')}
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
