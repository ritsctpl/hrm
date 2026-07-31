'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Tabs, message } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import CommonAppBar from '@/components/CommonAppBar';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import Can from '../hrmAccess/components/Can';
import { useCan } from '../hrmAccess/hooks/useCan';
import { useHrmUserGuideStore } from './stores/hrmUserGuideStore';
import { useHrmUserGuideData } from './hooks/useHrmUserGuideData';
import GuideLibraryTemplate from './components/templates/GuideLibraryTemplate';
import ModuleRail from './components/molecules/ModuleRail';
import GuideSearchBar from './components/molecules/GuideSearchBar';
import GuideLibraryGrid from './components/organisms/GuideLibraryGrid';
import GuideAdminTable from './components/organisms/GuideAdminTable';
import GuideFormDrawer from './components/organisms/GuideFormDrawer';
import HrmUserGuideScreen from './HrmUserGuideScreen';
import type { UserGuide } from './types/domain.types';
import type { GuideFormValues, GuideTabKey } from './types/ui.types';
import { MODULE_CODE } from './utils/guideConstants';
import { base64ToBlob, downloadBlob, filterGuides } from './utils/guideHelpers';
import styles from './styles/UserGuide.module.css';

const HrmUserGuideLanding: React.FC = () => {
  const store = useHrmUserGuideStore();
  const data = useHrmUserGuideData();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // RBAC — the Manage tab and every write action hang off the `user_guide_doc`
  // object. Everyone with module VIEW can read and download.
  const docPerms = useCan(MODULE_CODE, 'user_guide_doc');
  const canManage = docPerms.canAdd || docPerms.canEdit || docPerms.canDelete;

  const { activeTab, activeModuleCode, adminFilterModuleCode, adminFilterStatus } = store;

  // Library: reload from the server whenever the rail selection changes.
  // Text search is applied client-side so typing stays responsive.
  useEffect(() => {
    data.loadGuides(activeModuleCode || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleCode]);

  useEffect(() => {
    data.loadModuleCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin list is fetched lazily — only once the user opens Manage, and only
  // if they hold the grant, so no forbidden call fires for regular employees.
  useEffect(() => {
    if (activeTab === 'manage' && canManage) {
      data.loadAdminGuides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, canManage, adminFilterModuleCode, adminFilterStatus]);

  const visibleGuides = useMemo(
    () => filterGuides(store.guides, store.searchText, ''),
    [store.guides, store.searchText],
  );

  /**
   * List rows carry no file bytes, so a download fetches the full record
   * first. Guides already opened in the viewer come back with content and
   * skip the round trip.
   */
  const handleDownload = async (guide: UserGuide) => {
    setDownloadingId(guide.guideId);
    try {
      const full = guide.contentBase64 ? guide : await data.fetchGuideContent(guide.guideId);
      if (!full?.contentBase64) {
        message.warning('No file attached to this guide');
        return;
      }
      downloadBlob(
        base64ToBlob(full.contentBase64, full.fileType || 'application/pdf'),
        full.fileName || `${full.title}.pdf`,
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // After any write, refresh whichever lists the user can currently see —
  // the rail counts shift when a guide is added, published or archived.
  const refreshAll = () => {
    data.loadModuleCounts();
    data.loadGuides(store.activeModuleCode || undefined);
    if (canManage) data.loadAdminGuides();
  };

  const handleSubmitForm = async (values: GuideFormValues, file?: File): Promise<boolean> => {
    const ok = store.editGuide
      ? await data.updateGuide({ guideId: store.editGuide.guideId, ...values }, file)
      : await data.createGuide({ ...values, status: 'PUBLISHED' }, file as File);
    if (ok) refreshAll();
    return ok;
  };

  const handlePublish = async (guide: UserGuide) => {
    if (await data.publishGuide(guide.guideId)) refreshAll();
  };

  const handleDelete = async (guide: UserGuide) => {
    if (await data.deleteGuide(guide.guideId)) refreshAll();
  };

  const uploadButton = (
    <Can I="add" object="user_guide_doc">
      <Button
        type="primary"
        size="small"
        icon={<AddIcon style={{ fontSize: 16 }} />}
        onClick={() => store.openFormDrawer(null)}
      >
        Upload Guide
      </Button>
    </Can>
  );

  const browseTab = (
    <GuideLibraryTemplate
      leftPanel={
        <ModuleRail
          modules={store.moduleCounts}
          loading={store.moduleCountsLoading}
          activeModuleCode={store.activeModuleCode}
          onSelect={store.setActiveModuleCode}
        />
      }
      rightPanel={
        <>
          <GuideSearchBar
            searchText={store.searchText}
            onSearchChange={store.setSearchText}
            viewMode={store.viewMode}
            onViewModeChange={store.setViewMode}
            onReload={refreshAll}
            extra={uploadButton}
          />
          <GuideLibraryGrid
            guides={visibleGuides}
            loading={store.guidesLoading}
            viewMode={store.viewMode}
            onOpen={data.openGuide}
            onDownload={handleDownload}
            downloadingId={downloadingId}
            emptyAction={uploadButton}
          />
        </>
      }
    />
  );

  const manageTab = (
    <GuideAdminTable
      guides={store.adminGuides}
      loading={store.adminGuidesLoading}
      filterModuleCode={store.adminFilterModuleCode}
      filterStatus={store.adminFilterStatus}
      onFilterModuleChange={store.setAdminFilterModuleCode}
      onFilterStatusChange={store.setAdminFilterStatus}
      onReload={data.loadAdminGuides}
      onCreate={() => store.openFormDrawer(null)}
      onEdit={(guide) => store.openFormDrawer(guide)}
      onView={data.openGuide}
      onPublish={handlePublish}
      onDelete={handleDelete}
    />
  );

  const tabItems = [
    { key: 'browse', label: 'Guides', children: browseTab },
    ...(canManage ? [{ key: 'manage', label: 'Manage', children: manageTab }] : []),
  ];

  // Never point Tabs at a hidden key — a user whose grant is revoked mid-
  // session would otherwise land on a tab that no longer renders.
  const visibleKeys = tabItems.map((t) => t.key);
  const activeKey = visibleKeys.includes(store.activeTab) ? store.activeTab : visibleKeys[0];

  return (
    <ModuleAccessGate moduleCode={MODULE_CODE} appTitle="User Guides">
      <div className={`hrm-module-root ${styles.guideRoot}`}>
        <CommonAppBar appTitle="User Guides" />
        <div className={styles.guideContent}>
          <Tabs
            activeKey={activeKey}
            onChange={(k) => store.setActiveTab(k as GuideTabKey)}
            items={tabItems}
            size="small"
            tabBarStyle={{
              marginBottom: 0,
              padding: '0 16px',
              borderBottom: '1px solid #e8e8e8',
            }}
            style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
            destroyOnHidden={false}
          />
        </div>

        <GuideFormDrawer
          open={store.showFormDrawer}
          editGuide={store.editGuide}
          saving={store.saving}
          onClose={store.closeFormDrawer}
          onSubmit={handleSubmitForm}
          defaultModuleCode={store.activeModuleCode || undefined}
        />

        <HrmUserGuideScreen />
      </div>
    </ModuleAccessGate>
  );
};

export default HrmUserGuideLanding;
