'use client';

import React, { useEffect } from 'react';
import { Tabs, message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmAnnouncementStore } from './stores/hrmAnnouncementStore';
import { HrmAnnouncementService } from './services/hrmAnnouncementService';
import { useHrmAnnouncementData } from './hooks/useHrmAnnouncementData';
import AnnouncementFeedTemplate from './components/templates/AnnouncementFeedTemplate';
import AnnouncementAdminTemplate from './components/templates/AnnouncementAdminTemplate';
import AnnouncementComposeDrawer from './components/organisms/AnnouncementComposeDrawer';
import AnnouncementDetailPanel from './components/organisms/AnnouncementDetailPanel';
import EngagementStatsPanel from './components/organisms/EngagementStatsPanel';
import WithdrawConfirmModal from './components/organisms/WithdrawConfirmModal';
import ApprovalInbox from './components/organisms/ApprovalInbox';
import ApprovalActionModal, { type ApprovalAction } from './components/organisms/ApprovalActionModal';
import RatifyConfirmModal from './components/organisms/RatifyConfirmModal';
import ApprovalPolicyAdmin from './components/organisms/ApprovalPolicyAdmin';
import { currentStep } from './components/molecules/ApprovalLevelIndicator';
import { useAnnouncementPermissions } from './hooks/useAnnouncementPermissions';
import { parseAnnouncementError } from './utils/announcementErrors';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import { useCan } from '../hrmAccess/hooks/useCan';
import { useEmployeeIdentity } from '../hrmAccess/hooks/useEmployeeIdentity';
import { Announcement } from './types/domain.types';
import type { ApprovalPolicy } from './types/api.types';
import { ANNOUNCEMENT_HR_ROLES } from './utils/constants';
import styles from './styles/HrmAnnouncement.module.css';

const HrmAnnouncementLanding: React.FC = () => {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  // Must be the employee CODE, not the login email. The backend resolves the
  // actor by code — `cookies.userId` is typically the email, which resolves to
  // no employee and comes back 403. See useEmployeeIdentity's contract.
  const { employeeCode: employeeId, isReady: identityReady } = useEmployeeIdentity();
  // Admin rights come from RBAC on `announcement_record` — same pattern as every
  // other module. The legacy `userRole` cookie list is kept as a fallback so
  // installs that haven't seeded HRM_ANNOUNCEMENT permissions yet don't lose the
  // Admin tab; drop it once RBAC is seeded everywhere.
  const role = cookies.userRole ?? 'EMPLOYEE';
  const recordPerms = useCan('HRM_ANNOUNCEMENT', 'announcement_record');
  const canAdmin =
    recordPerms.canAdd ||
    recordPerms.canEdit ||
    recordPerms.canDelete ||
    ANNOUNCEMENT_HR_ROLES.includes(role);

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
    setSelectedAnnouncement,
    closeDetailPanel,
    openComposeDrawer,
    closeComposeDrawer,
    setFilterCategory,
    setFilterPriority,
    markAsRead,
    setPublishing,
    setWithdrawing,
    withdrawing,
    isWithdrawConfirmOpen,
    withdrawTarget,
    openWithdrawConfirm,
    closeWithdrawConfirm,
    engagementStats,
    engagementLoading,
    pendingApprovals,
    approvalsLoading,
    approvalActing,
    setPendingApprovals,
    setApprovalsLoading,
    setApprovalActing,
  } = useHrmAnnouncementStore();

  const can = useAnnouncementPermissions();
  const isApprover = can.approveL1 || can.approveTop;
  const [approvalTarget, setApprovalTarget] = React.useState<Announcement | null>(null);
  const [approvalAction, setApprovalAction] = React.useState<ApprovalAction>('approve');
  const [ratifyIntent, setRatifyIntent] = React.useState<boolean | null>(null);
  const [ratifying, setRatifying] = React.useState(false);
  const [retryingEmails, setRetryingEmails] = React.useState(false);
  const [policies, setPolicies] = React.useState<ApprovalPolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = React.useState(false);
  const [savingPriority, setSavingPriority] = React.useState<string | null>(null);

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
      await HrmAnnouncementService.markRead({ organizationId, announcementHandle, employeeId });
      markAsRead(announcementHandle);
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    const unread = [
      ...(Array.isArray(feed) ? feed : []),
      ...(Array.isArray(pinnedAnnouncements) ? pinnedAnnouncements : []),
    ].filter(
      (a) => !a.isRead
    );
    for (const a of unread) {
      await handleMarkRead(a.handle);
    }
    if (unread.length > 0) {
      message.success('All announcements marked as read');
    }
  };

  /**
   * Opens the detail view immediately from the list record, then upgrades it
   * with `/get`. Only `/get` returns `approvalChain` / `currentLevel` — the
   * feed, search and pending-approval responses are summaries without it.
   * Audience-scoped, so `actorId` is mandatory or the server 404s.
   */
  const openDetailWithChain = React.useCallback(
    async (announcement: Announcement) => {
      openDetailPanel(announcement);
      try {
        const full = await HrmAnnouncementService.getDetail({
          organizationId,
          announcementHandle: announcement.handle,
          actorId: employeeId,
        });
        if (full) setSelectedAnnouncement({ ...announcement, ...full });
      } catch (err) {
        // Non-fatal: the summary is already on screen, just without the chain.
        const info = parseAnnouncementError(err, 'Could not load full announcement details');
        if (info.status !== 404) message.error(info.message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizationId, employeeId]
  );

  const handleAnnouncementClick = (announcement: Announcement) => {
    openDetailWithChain(announcement);
    if (!announcement.isRead) {
      handleMarkRead(announcement.handle);
    }
  };

  const handlePublish = async (announcementHandle: string) => {
    setPublishing(true);
    try {
      await HrmAnnouncementService.publishAnnouncement({ organizationId, announcementHandle });
      message.success('Announcement published');
      loadAdminAnnouncements();
      loadFeed();
    } catch {
      message.error('Failed to publish announcement');
    } finally {
      setPublishing(false);
    }
  };

  const handleWithdrawConfirm = async (reason: string) => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      await HrmAnnouncementService.withdrawAnnouncement({
        organizationId,
        announcementHandle: withdrawTarget.handle,
        withdrawnBy: employeeId,
        reason,
      });
      message.success('Announcement withdrawn');
      closeWithdrawConfirm();
      loadAdminAnnouncements();
      loadFeed();
    } catch {
      message.error('Failed to withdraw announcement');
    } finally {
      setWithdrawing(false);
    }
  };


  const handleRatifyConfirm = async (remarks: string) => {
    if (!selectedAnnouncement || ratifyIntent === null) return;
    setRatifying(true);
    try {
      const updated = await HrmAnnouncementService.ratify({
        organizationId,
        announcementHandle: selectedAnnouncement.handle,
        actorId: employeeId,
        ratified: ratifyIntent,
        remarks,
      });
      // Refusal withdraws it, so the record on screen must reflect the new state.
      if (updated) setSelectedAnnouncement({ ...selectedAnnouncement, ...updated });
      message.success(ratifyIntent ? 'Emergency publish ratified' : 'Ratification refused — announcement withdrawn');
      setRatifyIntent(null);
      loadFeed();
      if (canAdmin) loadAdminAnnouncements();
    } catch (err) {
      const info = parseAnnouncementError(err, 'Failed to record ratification');
      message.error(info.message);
      if (info.shouldRefetch) {
        setRatifyIntent(null);
        openDetailWithChain(selectedAnnouncement);
      }
    } finally {
      setRatifying(false);
    }
  };

  const handleRetryFailedEmails = async () => {
    if (!selectedAnnouncement) return;
    setRetryingEmails(true);
    try {
      await HrmAnnouncementService.retryFailedEmails({
        organizationId,
        announcementHandle: selectedAnnouncement.handle,
        actorId: employeeId,
      });
      message.success('Failed emails re-queued — counts will update as they send');
      // Re-read the counters; the queue drains asynchronously so this is a
      // snapshot, not a final result.
      loadEngagementStats(selectedAnnouncement.handle);
    } catch (err) {
      const info = parseAnnouncementError(err, 'Failed to re-queue emails');
      message.error(info.message);
    } finally {
      setRetryingEmails(false);
    }
  };

  const loadPolicies = React.useCallback(async () => {
    setPoliciesLoading(true);
    try {
      const data = await HrmAnnouncementService.listPolicies({
        organizationId,
        actorId: employeeId,
      });
      setPolicies(data ?? []);
    } catch (err) {
      message.error(parseAnnouncementError(err, 'Failed to load approval policies').message);
    } finally {
      setPoliciesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, employeeId]);

  useEffect(() => {
    if (activeTab === 'policy' && can.manage && identityReady) {
      loadPolicies();
    }
  }, [activeTab, can.manage, identityReady, loadPolicies]);

  const handleSavePolicy = async (policy: typeof policies[number]) => {
    setSavingPriority(policy.priority);
    try {
      // This endpoint reads the tenant from `site` and the actor from
      // `modifiedBy`, unlike the rest of the module.
      const updated = await HrmAnnouncementService.updatePolicy({
        ...policy,
        site: policy.site || organizationId,
        modifiedBy: employeeId,
      });
      setPolicies(policies.map((p) => (p.priority === policy.priority ? updated ?? policy : p)));
      message.success(`${policy.priority} route saved`);
    } catch (err) {
      // The server names the exact problem on 422 — show it rather than a generic.
      message.error(parseAnnouncementError(err, 'Failed to save approval policy').message);
    } finally {
      setSavingPriority(null);
    }
  };

  const loadPendingApprovals = React.useCallback(async () => {
    if (!employeeId) return;
    setApprovalsLoading(true);
    try {
      const items = await HrmAnnouncementService.getPendingApprovals({
        organizationId,
        approverId: employeeId,
      });
      setPendingApprovals(items ?? []);
    } catch {
      message.error('Failed to load pending approvals');
    } finally {
      setApprovalsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, employeeId]);

  useEffect(() => {
    if (activeTab === 'approvals' && isApprover && identityReady) {
      loadPendingApprovals();
    }
  }, [activeTab, isApprover, identityReady, loadPendingApprovals]);

  const openApprovalAction = (announcement: Announcement, action: ApprovalAction) => {
    setApprovalTarget(announcement);
    setApprovalAction(action);
  };

  const handleApprovalConfirm = async (remarks: string) => {
    if (!approvalTarget) return;
    setApprovalActing(true);
    // expectedLevel is the rung the UI rendered — if the chain moved on we get
    // 409 ALREADY_ACTIONED instead of silently actioning a step never seen.
    const expectedLevel = currentStep(approvalTarget)?.level;
    const payload = {
      organizationId,
      announcementHandle: approvalTarget.handle,
      actorId: employeeId,
      remarks,
      expectedLevel,
    };
    const verb =
      approvalAction === 'approve' ? 'approved'
      : approvalAction === 'reject' ? 'rejected'
      : 'returned for edit';
    try {
      if (approvalAction === 'approve') await HrmAnnouncementService.approve(payload);
      else if (approvalAction === 'reject') await HrmAnnouncementService.reject(payload);
      else await HrmAnnouncementService.returnForEdit(payload);
      message.success(`Announcement ${verb}`);
      setApprovalTarget(null);
      loadPendingApprovals();
    } catch (err) {
      const info = parseAnnouncementError(err, `Failed to ${approvalAction} announcement`);
      message.error(info.message);
      if (info.shouldRefetch) {
        setApprovalTarget(null);
        loadPendingApprovals();
      }
    } finally {
      setApprovalActing(false);
    }
  };

  const handleViewStats = (announcement: Announcement) => {
    loadEngagementStats(announcement.handle);
    openDetailWithChain(announcement);
  };

  const handleDrawerSaved = () => {
    closeComposeDrawer();
    loadAdminAnnouncements();
    loadFeed();
  };

  if (showDetailPanel && selectedAnnouncement) {
    return (
      <ModuleAccessGate moduleCode="HRM_ANNOUNCEMENT" appTitle="Announcements">
        <div className={`hrm-module-root ${styles.landing}`}>
          <CommonAppBar
            appTitle={`Announcements > ${selectedAnnouncement.title}`}
          />
          <AnnouncementDetailPanel
            announcement={selectedAnnouncement}
            onClose={closeDetailPanel}
            onMarkRead={handleMarkRead}
            canRatify={can.approveTop}
            onRatify={() => setRatifyIntent(true)}
            onRefuseRatification={() => setRatifyIntent(false)}
          />
          <RatifyConfirmModal
            open={ratifyIntent !== null}
            ratifying={ratifyIntent === true}
            announcement={selectedAnnouncement}
            submitting={ratifying}
            onCancel={() => setRatifyIntent(null)}
            onConfirm={handleRatifyConfirm}
          />
          {canAdmin && (
            <EngagementStatsPanel
              stats={engagementStats}
              loading={engagementLoading}
              canRetryEmails={can.report || can.manage}
              onRetryFailedEmails={handleRetryFailedEmails}
              retryingEmails={retryingEmails}
            />
          )}
        </div>
      </ModuleAccessGate>
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

  if (isApprover) {
    tabItems.push({
      key: 'approvals',
      label: `Approvals${pendingApprovals.length ? ` (${pendingApprovals.length})` : ''}`,
      children: (
        <ApprovalInbox
          items={pendingApprovals}
          loading={approvalsLoading}
          can={can}
          actorId={employeeId}
          onAction={openApprovalAction}
          onOpen={openDetailWithChain}
        />
      ),
    });
  }

  if (can.manage) {
    tabItems.push({
      key: 'policy',
      label: 'Approval Policy',
      children: (
        <ApprovalPolicyAdmin
          policies={policies}
          loading={policiesLoading}
          savingPriority={savingPriority}
          onSave={handleSavePolicy}
        />
      ),
    });
  }

  if (canAdmin) {
    tabItems.push({
      key: 'admin',
      label: 'Admin',
      children: (
        <AnnouncementAdminTemplate
          announcements={adminAnnouncements}
          loading={adminLoading}
          onEdit={(a: Announcement) => openComposeDrawer(a)}
          onPublish={handlePublish}
          onWithdraw={openWithdrawConfirm}
          onViewStats={handleViewStats}
          onCreateNew={() => openComposeDrawer()}
        />
      ),
    });
  }

  return (
    <ModuleAccessGate moduleCode="HRM_ANNOUNCEMENT" appTitle="Announcements">
      <div className={`hrm-module-root ${styles.landing}`}>
        <CommonAppBar appTitle="Announcements" />
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'feed' | 'admin' | 'approvals' | 'policy')}
          items={tabItems}
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
          style={{ flex: 1, overflow: 'hidden' }}
        />
        {/* Mounted here, not inside the Admin tab — the "+" on the Feed tab
            opens it too, and an inactive tab's children are never rendered. */}
        <AnnouncementComposeDrawer
          open={showComposeDrawer}
          editAnnouncement={editAnnouncement}
          organizationId={organizationId}
          onClose={closeComposeDrawer}
          onSaved={handleDrawerSaved}
        />
        <WithdrawConfirmModal
          open={isWithdrawConfirmOpen}
          announcement={withdrawTarget}
          confirming={withdrawing}
          onCancel={closeWithdrawConfirm}
          onConfirm={handleWithdrawConfirm}
        />
        <ApprovalActionModal
          open={!!approvalTarget}
          action={approvalAction}
          announcement={approvalTarget}
          expectedLevel={approvalTarget ? currentStep(approvalTarget)?.level : undefined}
          submitting={approvalActing}
          onCancel={() => setApprovalTarget(null)}
          onConfirm={handleApprovalConfirm}
        />
      </div>
    </ModuleAccessGate>
  );
};

export default HrmAnnouncementLanding;
