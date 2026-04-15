'use client';

import { useEffect, useState, useMemo } from 'react';
import { Tabs, Button, Space, message } from 'antd';
import { parseCookies } from 'nookies';
import { LockOutlined, UnlockOutlined, ApartmentOutlined } from '@ant-design/icons';
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
import type { Holiday } from './types/domain.types';
import { useHolidayDetail } from './hooks/useHolidayDetail';
import type { HrmHolidayScreenProps } from './types/ui.types';
import Can from '../hrmAccess/components/Can';
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
    monthFilter,
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
    updateGroupStatus,
    setCalendarMonth,
  } = useHrmHolidayStore();

  const { loadHolidays, loadCategories } = useHolidayDetail(site, group.handle);

  // Filter state for stats bar
  const [statsFilter, setStatsFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  // Filter holidays based on stats filter
  const filteredHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (statsFilter === 'upcoming') {
      return holidays.filter(h => new Date(h.date) >= today);
    } else if (statsFilter === 'completed') {
      return holidays.filter(h => new Date(h.date) < today);
    }
    return holidays; // 'all'
  }, [holidays, statsFilter]);

  useEffect(() => {
    loadHolidays({
      groupHandle: group.handle,
      category: categoryFilter ?? undefined,
      month: monthFilter ?? undefined,
    });
  }, [group.handle, categoryFilter, monthFilter]);

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

  const handleDeleteHoliday = async (holiday: Holiday) => {
    try {
      await HrmHolidayService.deleteHoliday({ site, handle: holiday.handle, deletedBy: userId });
      await loadHolidays({ groupHandle: group.handle, category: categoryFilter ?? undefined });
      message.success('Holiday deleted successfully');
    } catch {
      message.error('Failed to delete holiday');
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
          holidays={filteredHolidays}
          loading={holidaysLoading}
          groupStatus={group.status}
          onEdit={permissions.canEdit ? openHolidayForm : undefined}
          onDelete={permissions.canDelete ? handleDeleteHoliday : undefined}
          onAddHoliday={permissions.canEdit ? () => openHolidayForm() : undefined}
        />
      ),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      children: (
        <HolidayCalendarView
          holidays={filteredHolidays}
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
          onFilterChange={setStatsFilter}
          activeFilter={statsFilter}
        />
      </div>

      <div className={styles.actionBar}>
        <Space wrap>
          {permissions.canPublish && group.status === 'DRAFT' && (
            <Can I="edit">
              <Button
                size="small"
                type="primary"
                onClick={openPublishModal}
              >
                Publish
              </Button>
            </Can>
          )}
          {permissions.canLock && group.status === 'PUBLISHED' && (
            <Can I="edit">
              <Button
                size="small"
                icon={<LockOutlined />}
                onClick={openLockModal}
              >
                Lock
              </Button>
            </Can>
          )}
          {permissions.canUnlock && group.status === 'LOCKED' && (
            <Can I="edit">
              <Button
                size="small"
                icon={<UnlockOutlined />}
                onClick={openUnlockModal}
              >
                Unlock
              </Button>
            </Can>
          )}
          {permissions.canMapBu && (
            <Can I="edit">
              <Button
                size="small"
                icon={<ApartmentOutlined />}
                onClick={openBuMapping}
              >
                Map BU
              </Button>
            </Can>
          )}
          {/* {permissions.canImport && ( */}
            {/* <Button
              size="small"
              icon={<UploadOutlined />}
              onClick={openImport}
              disabled={group.status === 'LOCKED'}
            >
              Import
            </Button> */}
          {/* )} */}
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'list' | 'calendar' | 'audit')}
        items={tabItems}
        className={styles.detailTabs}
        size="small"
        tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
      />

      <HolidayFormPanel
        open={showHolidayForm}
        groupHandle={group.handle}
        groupYear={group.year}
        groupStatus={group.status}
        holiday={editingHoliday}
        onClose={closeHolidayForm}
        onSaved={async () => {
          closeHolidayForm();
          message.success('Holiday saved');
          await loadHolidays({
            groupHandle: group.handle,
            category: categoryFilter ?? undefined,
            month: monthFilter ?? undefined,
          });
        }}
      />

      <BuMappingPanel
        open={showBuMapping}
        groupHandle={group.handle}
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
