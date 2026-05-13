'use client';

import { useEffect, useState, useMemo } from 'react';
import { Tabs, Button, Space, message } from 'antd';
import { parseCookies } from 'nookies';
import { LockOutlined, UnlockOutlined, ApartmentOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
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
import { useEmployeeIdentity } from '../hrmAccess/hooks/useEmployeeIdentity';
import styles from './styles/HolidayDetail.module.css';

export default function HrmHolidayScreen({ group, organizationId, permissions }: HrmHolidayScreenProps) {
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

  const { loadHolidays, loadCategories } = useHolidayDetail(organizationId, group.handle);

  // Filter state for stats bar
  const [statsFilter, setStatsFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingIcal, setExportingIcal] = useState(false);

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
  const { employeeCode } = useEmployeeIdentity();
  const userId = employeeCode;
  const userRole = cookies.userRole ?? '';

  const handlePublish = async (comment?: string) => {
    try {
      await HrmHolidayService.publishGroup({ organizationId, groupHandle: group.handle, comment, publishedBy: userId, publishedByRole: userRole });
      updateGroupStatus(group.handle, 'PUBLISHED');
      closePublishModal();
      message.success('Holiday group published');
    } catch {
      message.error('Failed to publish group');
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    try {
      await HrmHolidayService.deleteHoliday({ organizationId, handle: holiday.handle, deletedBy: userId, deletedByRole: userRole });
      await loadHolidays({ groupHandle: group.handle, category: categoryFilter ?? undefined });
      message.success('Holiday deleted successfully');
    } catch {
      message.error('Failed to delete holiday');
    }
  };

  const handleLock = async (reason: string) => {
    try {
      await HrmHolidayService.lockGroup({ organizationId, groupHandle: group.handle, reason, lockedBy: userId, lockedByRole: userRole });
      updateGroupStatus(group.handle, 'LOCKED');
      closeLockModal();
      message.success('Holiday group locked');
    } catch {
      message.error('Failed to lock group');
    }
  };

  const handleUnlock = async (reason: string) => {
    try {
      await HrmHolidayService.unlockGroup({ organizationId, groupHandle: group.handle, reason, unlockedBy: userId, unlockedByRole: userRole });
      updateGroupStatus(group.handle, 'PUBLISHED');
      closeUnlockModal();
      message.success('Holiday group unlocked');
    } catch {
      message.error('Failed to unlock group');
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const safeFileSegment = (s: string) => s.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 60);

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const csvBlob = await HrmHolidayService.exportCsv({ organizationId, groupHandle: group.handle });
      const withBom = new Blob(['﻿', csvBlob], { type: 'text/csv;charset=utf-8' });
      triggerDownload(withBom, `holidays-${safeFileSegment(group.groupName)}-${group.year}.csv`);
      message.success('CSV downloaded');
    } catch {
      message.error('Failed to export CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportIcal = async () => {
    setExportingIcal(true);
    try {
      const ics = await HrmHolidayService.exportIcal({ organizationId, groupHandle: group.handle });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      triggerDownload(blob, `holidays-${safeFileSegment(group.groupName)}-${group.year}.ics`);
      message.success('Calendar file downloaded');
    } catch {
      message.error('Failed to export calendar');
    } finally {
      setExportingIcal(false);
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
      children: <AuditLogDrawer groupHandle={group.handle} organizationId={organizationId} />,
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
            <Can I="edit" passIf={permissions.canMapBu}>
              <Button
                size="small"
                icon={<ApartmentOutlined />}
                onClick={openBuMapping}
              >
                Map BU
              </Button>
            </Can>
          )}
          {permissions.canExport && holidays.length > 0 && (
            <>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                loading={exportingCsv}
                onClick={handleExportCsv}
              >
                CSV
              </Button>
              <Button
                size="small"
                icon={<CalendarOutlined />}
                loading={exportingIcal}
                onClick={handleExportIcal}
              >
                iCal
              </Button>
            </>
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
