'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, Button, Badge } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmAssetStore } from './stores/hrmAssetStore';
import { useHrmAssetData } from './hooks/useHrmAssetData';
import { useHrmAssetUI } from './hooks/useHrmAssetUI';
import AssetDashboardHeader from './components/organisms/AssetDashboardHeader';
import AssetSearchBar from './components/molecules/AssetSearchBar';
import AssetMasterList from './components/organisms/AssetMasterList';
import AssetRequestCard from './components/molecules/AssetRequestCard';
import ApprovalActionBar from './components/molecules/ApprovalActionBar';
import AssetForm from './components/organisms/AssetForm';
import AssetCategoryForm from './components/organisms/AssetCategoryForm';
import AssetRequestForm from './components/organisms/AssetRequestForm';
import ApprovalInbox from './components/organisms/ApprovalInbox';
import AssetMasterDetailTemplate from './components/templates/AssetMasterDetailTemplate';
import AssetRequestTemplate from './components/templates/AssetRequestTemplate';
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

  useEffect(() => {
    if (store.activeTab === 'requests') {
      data.loadMyRequests();
    } else if (store.activeTab === 'approvals') {
      data.loadPendingApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.activeTab]);

  useEffect(() => {
    if (store.selectedAsset) {
      data.loadAssetDetail(store.selectedAsset.assetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.selectedAsset?.assetId]);

  // ── ASSETS TAB ───────────────────────────────────────────────────────────

  const assetsTabContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AssetDashboardHeader dashboard={store.dashboard!} loading={store.loadingDashboard} />
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
            icon={<RefreshIcon style={{ fontSize: 14 }} />}
            onClick={data.loadAssets}
          />
          <Button
            size="small"
            onClick={() => setCategoryFormOpen(true)}
          >
            Categories
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<AddIcon style={{ fontSize: 14 }} />}
            onClick={store.openAssetForm}
          >
            Add Asset
          </Button>
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

  // ── REQUESTS TAB ─────────────────────────────────────────────────────────

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
          icon={<AddIcon style={{ fontSize: 14 }} />}
          onClick={store.openRequestForm}
        >
          New Request
        </Button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AssetRequestTemplate
          listPanel={
            <div>
              {store.loadingRequests ? null : store.myRequests.map((req: AssetRequest) => (
                <AssetRequestCard
                  key={req.requestId}
                  request={req}
                  isSelected={store.selectedRequest?.requestId === req.requestId}
                  onClick={(r) => store.setSelectedRequest(r)}
                />
              ))}
            </div>
          }
          detailPanel={
            store.selectedRequest ? (
              <ApprovalActionBar
                request={store.selectedRequest}
                onApprove={async (_requestId, _remarks) => {
                  await data.loadMyRequests();
                }}
                onReject={async (_requestId, _remarks) => {
                  await data.loadMyRequests();
                }}
              />
            ) : null
          }
        />
      </div>
    </div>
  );

  // ── APPROVALS TAB ────────────────────────────────────────────────────────

  const approvalsTabContent = (
    <div style={{ height: '100%', overflow: 'auto', padding: 16 }}>
      <ApprovalInbox
        isSupervisor={true}
        isAdmin={true}
        loading={store.loadingRequests}
      />
    </div>
  );

  const tabItems = [
    {
      key: 'assets',
      label: 'Asset Register',
      children: assetsTabContent,
    },
    {
      key: 'requests',
      label: (
        <Badge count={ui.requestsBadgeCount} size="small" offset={[6, 0]}>
          My Requests
        </Badge>
      ),
      children: requestsTabContent,
    },
    {
      key: 'approvals',
      label: (
        <Badge count={ui.approvalsBadgeCount} size="small" offset={[6, 0]}>
          Approvals
        </Badge>
      ),
      children: approvalsTabContent,
    },
  ];

  return (
    <div className={styles.assetRoot}>
      <CommonAppBar appTitle="Asset Management" />
      <div className={styles.assetContent}>
        <Tabs
          activeKey={store.activeTab}
          onChange={(k) => store.setActiveTab(k as typeof store.activeTab)}
          items={tabItems}
          size="middle"
          style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
          destroyOnHidden={false}
        />
      </div>

      {store.isAssetFormOpen && (
        <AssetForm editAsset={store.selectedAsset} />
      )}
      {store.isRequestFormOpen && (
        <AssetRequestForm />
      )}
      <AssetCategoryForm
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
      />
    </div>
  );
};

export default HrmAssetLanding;
