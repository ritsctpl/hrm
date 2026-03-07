'use client';

import { useEffect } from 'react';
import { Tabs, Button, Space, message } from 'antd';
import { parseCookies } from 'nookies';
import AddIcon from '@mui/icons-material/Add';
import PublishIcon from '@mui/icons-material/Publish';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import UploadIcon from '@mui/icons-material/Upload';
import HolidayGroupDetailLayout from './components/templates/HolidayGroupDetailLayout';
import HolidayListTable from './components/organisms/HolidayListTable';
import HolidayCalendarView from './components/organisms/HolidayCalendarView';
import AuditLogDrawer from './components/organisms/AuditLogDrawer';
import HolidayFormPanel from './components/organisms/HolidayFormPanel';
import BuMappingPanel from './components/organisms/BuMappingPanel';
import ImportPanel from './components/organisms/ImportPanel';
import PublishConfirmModal from './components/organisms/PublishConfirmModal';
import LockConfirmModal from './components/organisms/LockConfirmModal';
import UnlockConfirmModal from './components/organisms/UnlockConfirmModal';
import GroupStatsBar from './components/molecules/GroupStatsBar';
import HolidayStatusChip from './components/atoms/HolidayStatusChip';
import { useHrmHolidayStore } from './stores/hrmHolidayStore';
import { HrmHolidayService } from './services/hrmHolidayService';
import { useHolidayDetail } from './hooks/useHolidayDetail';
import type { HrmHolidayScreenProps } from './types/ui.types';
import styles from './styles/HolidayDetail.module.css';

export default function HrmHolidayScreen({ group, site, permissions }: HrmHolidayScreenProps) {
  const {
    holidays,
    holidaysLoading,
    categories,
    activeTab,
    showHolidayForm,
    showBuMapping,
    showImport,
    showPublishModal,
    showLockModal,
    showUnlockModal,
    editingHoliday,
    categoryFilter,
    calendarMonth,
    setActiveTab,
    openHolidayForm,
    closeHolidayForm,
    openBuMapping,
    closeBuMapping,
    openImport,
    closeImport,
    openPublishModal,
    closePublishModal,
    openLockModal,
    closeLockModal,
    openUnlockModal,
    closeUnlockModal,
    addHoliday,
    updateHoliday,
    updateGroupStatus,
    setCalendarMonth,
  } = useHrmHolidayStore();

  const { loadHolidays, loadCategories } = useHolidayDetail(site, group.handle);

  useEffect(() => {
    loadHolidays({ groupHandle: group.handle, category: categoryFilter ?? undefined });
  }, [group.handle, categoryFilter]);

  useEffect(() => {
    loadCategories();
  }, []);

  const cookies = parseCookies();
  const userId = cookies.userId ?? '';

  const handlePublish = async (comment?: string) => {
    try {
      await HrmHolidayService.publishGroup({ site, groupHandle: group.handle, comment, publishedBy: userId });
      updateGroupStatus(group.handle, 'PUBLISHED');
      closePublishModal();
      message.success('Holiday group published');
    } catch {
      message.error('Failed to publish group');
    }
  };

  const handleLock = async (reason: string) => {
    try {
      await HrmHolidayService.lockGroup({ site, groupHandle: group.handle, reason, lockedBy: userId });
      updateGroupStatus(group.handle, 'LOCKED');
      closeLockModal();
      message.success('Holiday group locked');
    } catch {
      message.error('Failed to lock group');
    }
  };

  const handleUnlock = async (reason: string) => {
    try {
      await HrmHolidayService.unlockGroup({ site, groupHandle: group.handle, reason, unlockedBy: userId });
      updateGroupStatus(group.handle, 'PUBLISHED');
      closeUnlockModal();
      message.success('Holiday group unlocked');
    } catch {
      message.error('Failed to unlock group');
    }
  };

  const tabItems = [
    {
      key: 'list',
      label: 'List',
      children: (
        <HolidayListTable
          holidays={holidays}
          loading={holidaysLoading}
          groupStatus={group.status}
          onEdit={permissions.canEdit ? openHolidayForm : undefined}
          onAddHoliday={permissions.canEdit ? () => openHolidayForm() : undefined}
        />
      ),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      children: (
        <HolidayCalendarView
          holidays={holidays}
          categories={categories}
          year={group.year}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      ),
    },
    {
      key: 'audit',
      label: 'Audit Log',
      children: <AuditLogDrawer groupHandle={group.handle} site={site} />,
    },
  ];

  return (
    <HolidayGroupDetailLayout>
      <div className={styles.groupHeader}>
        <div className={styles.groupTitleRow}>
          <h2 className={styles.groupName}>{group.groupName}</h2>
          <HolidayStatusChip status={group.status} />
        </div>
        <GroupStatsBar
          total={group.totalHolidays}
          upcoming={group.upcomingCount}
          completed={group.completedCount}
        />
      </div>

      <div className={styles.actionBar}>
        <Space wrap>
          {permissions.canEdit && (
            <Button
              size="small"
              icon={<AddIcon style={{ fontSize: 15 }} />}
              onClick={() => openHolidayForm()}
              disabled={group.status === 'LOCKED'}
            >
              Add Holiday
            </Button>
          )}
          {permissions.canPublish && group.status === 'DRAFT' && (
            <Button
              size="small"
              type="primary"
              icon={<PublishIcon style={{ fontSize: 15 }} />}
              onClick={openPublishModal}
            >
              Publish
            </Button>
          )}
          {permissions.canLock && group.status === 'PUBLISHED' && (
            <Button
              size="small"
              icon={<LockIcon style={{ fontSize: 15 }} />}
              onClick={openLockModal}
            >
              Lock
            </Button>
          )}
          {permissions.canUnlock && group.status === 'LOCKED' && (
            <Button
              size="small"
              icon={<LockOpenIcon style={{ fontSize: 15 }} />}
              onClick={openUnlockModal}
            >
              Unlock
            </Button>
          )}
          {permissions.canMapBu && (
            <Button
              size="small"
              icon={<AccountTreeIcon style={{ fontSize: 15 }} />}
              onClick={openBuMapping}
            >
              Map BU
            </Button>
          )}
          {permissions.canImport && (
            <Button
              size="small"
              icon={<UploadIcon style={{ fontSize: 15 }} />}
              onClick={openImport}
              disabled={group.status === 'LOCKED'}
            >
              Import
            </Button>
          )}
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'list' | 'calendar' | 'audit')}
        items={tabItems}
        className={styles.detailTabs}
      />

      <HolidayFormPanel
        open={showHolidayForm}
        groupHandle={group.handle}
        groupYear={group.year}
        groupStatus={group.status}
        holiday={editingHoliday}
        onClose={closeHolidayForm}
        onSaved={(h) => {
          editingHoliday ? updateHoliday(h.handle, h) : addHoliday(h);
          closeHolidayForm();
          message.success('Holiday saved');
        }}
      />

      <BuMappingPanel
        open={showBuMapping}
        groupHandle={group.handle}
        mappings={group.mappings}
        onClose={closeBuMapping}
        onMappingChanged={() => {}}
      />

      <ImportPanel
        open={showImport}
        groupHandle={group.handle}
        groupName={group.groupName}
        onClose={closeImport}
        onImported={() => {
          loadHolidays({ groupHandle: group.handle });
          closeImport();
        }}
      />

      <PublishConfirmModal
        open={showPublishModal}
        groupName={group.groupName}
        onClose={closePublishModal}
        onConfirm={handlePublish}
      />
      <LockConfirmModal
        open={showLockModal}
        groupName={group.groupName}
        onClose={closeLockModal}
        onConfirm={handleLock}
      />
      <UnlockConfirmModal
        open={showUnlockModal}
        groupName={group.groupName}
        onClose={closeUnlockModal}
        onConfirm={handleUnlock}
      />
    </HolidayGroupDetailLayout>
  );
}
