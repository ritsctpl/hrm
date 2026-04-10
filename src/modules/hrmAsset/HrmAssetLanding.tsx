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
import styles from './styles/HrmAsset.module.css';

const HrmAssetLanding: React.FC = () => {
  const store = useHrmAssetStore();
  const data = useHrmAssetData();
  const ui = useHrmAssetUI();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<import('./types/domain.types').AssetCategory | null>(null);

  // RBAC — read once for hook logic (effect deps, approval flow branching).
  // UI-level gating uses <Can> so permissions flow automatically from the
  // enclosing ModuleAccessGate context.
  const perms = useCan('HRM_ASSET');
  const isSupervisor = perms.canEdit; // Approval flows reuse edit permission
  const isAdmin = perms.canDelete;    // Admin actions require delete permission

  // Load once on mount — no function refs in deps to avoid infinite loop
  useEffect(() => {
    data.initialLoad();
    if (isSupervisor || isAdmin) {
      data.loadPendingApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load requests and approvals when switching to that tab
  const activeTab = store.activeTab;
  useEffect(() => {
    if (activeTab === 'requests') {
      data.loadMyRequests();
      data.loadPendingApprovals();
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
          <Can I="edit">
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setCategoryFormOpen(true)}
            >
              Categories
            </Button>
          </Can>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={data.loadAssets}
          />
          <Can I="add">
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
        <Can I="add">
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

        {/* Approval Inbox Section */}
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
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'assets',
      label: 'Assets',
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
  ];

  return (
    <ModuleAccessGate moduleCode="HRM_ASSET" appTitle="Asset Management">
    <div className={`hrm-module-root ${styles.assetRoot}`}>
      <CommonAppBar appTitle="Asset Management" />
      {(store.dashboard || store.loadingDashboard) && (
        <AssetDashboardHeader dashboard={store.dashboard!} loading={store.loadingDashboard} />
      )}
      <div className={`${styles.assetContent} ${styles.tabsWrapper}`}>
        <Tabs
          activeKey={store.activeTab}
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
