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
import styles from './styles/HrmAsset.module.css';

const HrmAssetLanding: React.FC = () => {
  const store = useHrmAssetStore();
  const data = useHrmAssetData();
  const ui = useHrmAssetUI();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);

  useEffect(() => {
    data.initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load requests and approvals when switching to that tab
  useEffect(() => {
    if (store.activeTab === 'requests') {
      data.loadMyRequests();
      data.loadPendingApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.activeTab]);

  // Load asset detail data when selecting an asset
  useEffect(() => {
    if (store.selectedAsset) {
      data.loadAssetDetail(store.selectedAsset.assetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.selectedAsset?.assetId]);

  // ── ASSETS TAB ───────────────────────────────────────────────────────────

  const assetsTabContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setCategoryFormOpen(true)}
          >
            Categories
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={data.loadAssets}
          />
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={store.openAssetForm}
          >
            Add Asset
          </Button>
        </div>
      </div>

      {/* Category grid (collapsed into a quick-view section) */}
      {store.categories.length > 0 && store.filterCategory === '' && (
        <div className={styles.categoryChips}>
          {store.categories.map((cat) => (
            <button
              key={cat.categoryCode}
              className={styles.categoryChip}
              onClick={() => store.setFilterCategory(cat.categoryCode)}
            >
              <span className={styles.categoryChipName}>{cat.categoryName}</span>
            </button>
          ))}
        </div>
      )}

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
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={store.openRequestForm}
        >
          New Request
        </Button>
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
            isSupervisor={true}
            isAdmin={true}
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
    <div className={`hrm-module-root ${styles.assetRoot}`}>
      <CommonAppBar appTitle="Asset Management" />
      {(store.dashboard || store.loadingDashboard) && (
        <AssetDashboardHeader dashboard={store.dashboard!} loading={store.loadingDashboard} />
      )}
      <div className={styles.assetContent}>
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
        onClose={() => setCategoryFormOpen(false)}
      />
    </div>
  );
};

export default HrmAssetLanding;
