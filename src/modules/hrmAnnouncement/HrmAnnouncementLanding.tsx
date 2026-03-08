'use client';

import React, { useEffect } from 'react';
import { Tabs, message } from 'antd';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmAnnouncementStore } from './stores/hrmAnnouncementStore';
import { HrmAnnouncementService } from './services/hrmAnnouncementService';
import { useHrmAnnouncementData } from './hooks/useHrmAnnouncementData';
import AnnouncementFeedTemplate from './components/templates/AnnouncementFeedTemplate';
import AnnouncementAdminTemplate from './components/templates/AnnouncementAdminTemplate';
import AnnouncementDetailPanel from './components/organisms/AnnouncementDetailPanel';
import { Announcement } from './types/domain.types';
import { ANNOUNCEMENT_HR_ROLES } from './utils/constants';
import styles from './styles/HrmAnnouncement.module.css';

const HrmAnnouncementLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? 'RITS';
  const employeeId = cookies.userId ?? '';
  const role = cookies.userRole ?? 'EMPLOYEE';
  const canAdmin = ANNOUNCEMENT_HR_ROLES.includes(role);

  const {
    feed,
    pinnedAnnouncements,
    adminAnnouncements,
    selectedAnnouncement,
    feedLoading,
    adminLoading,
    showDetailPanel,
    showComposeDrawer,
    editAnnouncement,
    activeTab,
    filterCategory,
    filterPriority,
    setActiveTab,
    openDetailPanel,
    closeDetailPanel,
    openComposeDrawer,
    closeComposeDrawer,
    setFilterCategory,
    setFilterPriority,
    markAsRead,
    setPublishing,
    setWithdrawing,
  } = useHrmAnnouncementStore();

  const { loadFeed, loadAdminAnnouncements, loadEngagementStats } = useHrmAnnouncementData();

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterPriority]);

  useEffect(() => {
    if (activeTab === 'admin' && canAdmin) {
      loadAdminAnnouncements();
    }
  }, [activeTab, canAdmin, loadAdminAnnouncements]);

  const handleMarkRead = async (announcementHandle: string) => {
    try {
      await HrmAnnouncementService.markRead({ site, announcementHandle, employeeId });
      markAsRead(announcementHandle);
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    const unread = [...feed, ...pinnedAnnouncements].filter(
      (a) => !a.isRead
    );
    for (const a of unread) {
      await handleMarkRead(a.handle);
    }
    if (unread.length > 0) {
      message.success('All announcements marked as read');
    }
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    openDetailPanel(announcement);
    if (!announcement.isRead) {
      handleMarkRead(announcement.handle);
    }
  };

  const handlePublish = async (announcementHandle: string) => {
    setPublishing(true);
    try {
      await HrmAnnouncementService.publishAnnouncement({ site, announcementHandle });
      message.success('Announcement published');
      loadAdminAnnouncements();
      loadFeed();
    } catch {
      message.error('Failed to publish announcement');
    } finally {
      setPublishing(false);
    }
  };

  const handleWithdraw = async (announcementHandle: string) => {
    setWithdrawing(true);
    try {
      await HrmAnnouncementService.withdrawAnnouncement({
        site,
        announcementHandle,
        reason: 'Withdrawn by admin',
      });
      message.success('Announcement withdrawn');
      loadAdminAnnouncements();
      loadFeed();
    } catch {
      message.error('Failed to withdraw announcement');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleViewStats = (announcement: Announcement) => {
    loadEngagementStats(announcement.handle);
    openDetailPanel(announcement);
  };

  const handleDrawerSaved = () => {
    closeComposeDrawer();
    loadAdminAnnouncements();
    loadFeed();
  };

  if (showDetailPanel && selectedAnnouncement) {
    return (
      <div className={styles.landing}>
        <CommonAppBar
          appTitle={`Announcements > ${selectedAnnouncement.title}`}
        />
        <AnnouncementDetailPanel
          announcement={selectedAnnouncement}
          onClose={closeDetailPanel}
          onMarkRead={handleMarkRead}
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'feed',
      label: 'Announcement Feed',
      children: (
        <AnnouncementFeedTemplate
          pinnedAnnouncements={pinnedAnnouncements}
          feed={feed}
          loading={feedLoading}
          filterCategory={filterCategory}
          filterPriority={filterPriority}
          canAdmin={canAdmin}
          onAnnouncementClick={handleAnnouncementClick}
          onCategoryFilter={setFilterCategory}
          onPriorityFilter={setFilterPriority}
          onMarkAllRead={handleMarkAllRead}
          onCreateNew={() => openComposeDrawer()}
        />
      ),
    },
  ];

  if (canAdmin) {
    tabItems.push({
      key: 'admin',
      label: 'Admin',
      children: (
        <AnnouncementAdminTemplate
          announcements={adminAnnouncements}
          loading={adminLoading}
          showComposeDrawer={showComposeDrawer}
          editAnnouncement={editAnnouncement}
          site={site}
          onEdit={(a: Announcement) => openComposeDrawer(a)}
          onPublish={handlePublish}
          onWithdraw={handleWithdraw}
          onViewStats={handleViewStats}
          onCreateNew={() => openComposeDrawer()}
          onDrawerClose={closeComposeDrawer}
          onDrawerSaved={handleDrawerSaved}
        />
      ),
    });
  }

  return (
    <div className={styles.landing}>
      <CommonAppBar appTitle="Announcements" />
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'feed' | 'admin')}
        items={tabItems}
        size="small"
        tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
        style={{ flex: 1, overflow: 'hidden' }}
      />
    </div>
  );
};

export default HrmAnnouncementLanding;
