'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Tabs } from 'antd';
import AddIcon from '@mui/icons-material/Add';
import dayjs, { type Dayjs } from 'dayjs';
import CommonAppBar from '@/components/CommonAppBar';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import Can from '../hrmAccess/components/Can';
import { useCan } from '../hrmAccess/hooks/useCan';
import { useHrmTicketStore } from './stores/hrmTicketStore';
import { useHrmTicketData } from './hooks/useHrmTicketData';
import TicketQueueTemplate from './components/templates/TicketQueueTemplate';
import TicketFilterBar from './components/molecules/TicketFilterBar';
import TicketStatusSummary from './components/molecules/TicketStatusSummary';
import TicketTable from './components/organisms/TicketTable';
import RaiseTicketDrawer from './components/organisms/RaiseTicketDrawer';
import TicketDetailDrawer from './components/organisms/TicketDetailDrawer';
import TicketActionModal from './components/organisms/TicketActionModal';
import CategoryAdminTable from './components/organisms/CategoryAdminTable';
import CategoryFormDrawer from './components/organisms/CategoryFormDrawer';
import SupportGroupAdminTable from './components/organisms/SupportGroupAdminTable';
import SupportGroupFormDrawer from './components/organisms/SupportGroupFormDrawer';
import TicketDashboardPanel from './components/organisms/TicketDashboardPanel';
import type { Ticket, TicketStatus } from './types/domain.types';
import type {
  TicketActionKind,
  TicketCategoryFormValues,
  TicketFormValues,
  TicketGroupFormValues,
  TicketTabKey,
} from './types/ui.types';
import { MODULE_CODE } from './utils/ticketConstants';
import { filesToPayload } from './utils/ticketHelpers';
import styles from './styles/Ticket.module.css';

/**
 * The ticket workspace.
 *
 * Tabs are built from grants rather than rendered-then-hidden: an employee sees My Tickets, an
 * agent additionally sees the queue and their assigned work, a lead gets the dashboard, and an
 * administrator gets categories and groups. Building the list this way means a user whose access
 * is revoked mid-session cannot be left sitting on a tab that no longer renders.
 */
const HrmTicketLanding: React.FC = () => {
  const store = useHrmTicketStore();
  const data = useHrmTicketData();

  const queuePerms = useCan(MODULE_CODE, 'ticket_queue');
  const assignPerms = useCan(MODULE_CODE, 'ticket_assign');
  const configPerms = useCan(MODULE_CODE, 'ticket_category');
  const reportPerms = useCan(MODULE_CODE, 'ticket_report');

  const isAgent = queuePerms.canView || queuePerms.canEdit || assignPerms.canEdit;
  const canManageConfig = configPerms.canEdit || configPerms.canAdd;
  const canSeeReports = reportPerms.canView;

  const [dashboardGroup, setDashboardGroup] = useState<string | undefined>();
  const [dashboardRange, setDashboardRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const { activeTab, filters } = store;
  const listTabs: TicketTabKey[] = useMemo(() => ['my', 'queue', 'assigned', 'all'], []);
  const isListTab = listTabs.includes(activeTab);
  const currentFilter = filters[activeTab];

  // The category list backs both the raise form and the filter bar, so it is loaded once up front
  // rather than per drawer open.
  useEffect(() => {
    data.loadCategories({ asTree: true, includeRestricted: isAgent });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgent]);

  // Reloads whenever the active tab's own filter changes. Filters are per tab, so switching tabs
  // shows that tab's last view rather than the one just left behind.
  useEffect(() => {
    if (isListTab) data.loadTickets(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentFilter]);

  useEffect(() => {
    if (activeTab === 'categories' || activeTab === 'groups') {
      data.loadSupportGroups(activeTab === 'groups');
      if (activeTab === 'categories') data.loadCategories({ includeRestricted: true, withCounts: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    if (store.supportGroups.length === 0) data.loadSupportGroups(false);
    data.loadDashboard(
      dashboardGroup,
      dashboardRange[0].format('YYYY-MM-DD'),
      dashboardRange[1].format('YYYY-MM-DD'),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dashboardGroup, dashboardRange]);

  // ── Handlers ──────────────────────────────────────────────────────

  const refreshList = useCallback(() => {
    if (isListTab) data.loadTickets(activeTab);
  }, [data, activeTab, isListTab]);

  const handleOpen = useCallback(
    async (ticketNumber: string) => {
      store.openDetail(null);
      const ticket = await data.openTicket(ticketNumber);
      // The assignee picker needs the group's members, and the detail panel is the only place it
      // is used — fetching it here keeps a per-row call off the queue screen.
      if (ticket?.categoryCode) data.loadAssignableAgents(ticket.categoryCode);
    },
    [data, store],
  );

  const handleRaise = async (values: TicketFormValues, files: File[]) => {
    const attachments = await filesToPayload(files);
    const ticket = store.editTicket
      ? await data.updateTicket(
          {
            ticketNumber: store.editTicket.ticketNumber,
            subject: values.subject,
            description: values.description,
            categoryCode: values.categoryCode,
            priority: values.priority,
            tags: values.tags,
            watcherCodes: values.watcherCodes,
          },
          attachments,
        )
      : await data.createTicket(values, attachments);
    if (ticket) refreshList();
    return Boolean(ticket);
  };

  const handleAction = async (payload: {
    assigneeCode?: string;
    status?: TicketStatus;
    note?: string;
    satisfactionRating?: number;
  }) => {
    const ticketNumber = store.selectedTicket?.ticketNumber;
    if (!ticketNumber) return;

    let result: Ticket | null = null;
    switch (store.activeAction) {
      case 'assign':
        result = await data.assignTicket(ticketNumber, payload.assigneeCode!, payload.note);
        break;
      case 'hold':
        result = await data.changeStatus(ticketNumber, payload.status, payload.note);
        break;
      case 'resolve':
        result = await data.resolveTicket(ticketNumber, payload.note!);
        break;
      case 'reopen':
        result = await data.reopenTicket(ticketNumber, payload.note!);
        break;
      case 'close':
        result = await data.closeTicket(ticketNumber, payload.note, payload.satisfactionRating);
        break;
      case 'cancel':
        result = await data.cancelTicket(ticketNumber, payload.note!);
        break;
      case 'rate':
        result = await data.rateTicket(ticketNumber, payload.satisfactionRating!, payload.note);
        break;
      default:
        break;
    }
    if (result) refreshList();
  };

  const handleClaim = async (ticketNumber: string) => {
    if (await data.claimTicket(ticketNumber)) refreshList();
  };

  const handleComment = async (
    body: string,
    internal: boolean,
    files: File[],
    statusAfterComment?: TicketStatus,
  ) => {
    const ticketNumber = store.selectedTicket?.ticketNumber;
    if (!ticketNumber) return false;
    const attachments = await filesToPayload(files);
    const ok = await data.addComment(
      { ticketNumber, body, internal, statusAfterComment },
      attachments,
    );
    if (ok) refreshList();
    return ok;
  };

  const handleSaveCategory = async (values: TicketCategoryFormValues, isEdit: boolean) => {
    const ok = await data.saveCategory(values, isEdit);
    if (ok) data.loadCategories({ includeRestricted: true, withCounts: true });
    return ok;
  };

  const handleSaveGroup = async (values: TicketGroupFormValues, isEdit: boolean) => {
    const ok = await data.saveSupportGroup(values, isEdit);
    if (ok) data.loadSupportGroups(true);
    return ok;
  };

  const toggleStatus = (status: TicketStatus) => {
    const current = currentFilter.statuses;
    store.patchFilter(activeTab, {
      statuses: current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status],
    });
  };

  // ── Tabs ──────────────────────────────────────────────────────────

  const raiseButton = (
    <Can I="add" object="ticket_record">
      <Button
        type="primary"
        size="small"
        icon={<AddIcon style={{ fontSize: 16 }} />}
        onClick={() => store.openRaiseDrawer(null)}
      >
        Raise ticket
      </Button>
    </Can>
  );

  const listTab = (tab: TicketTabKey, options: { agentView?: boolean; emptyText?: string } = {}) => (
    <TicketQueueTemplate
      filterBar={
        <TicketFilterBar
          filter={filters[tab]}
          categories={store.categories}
          showAgentFilters={options.agentView}
          onChange={(patch) => store.patchFilter(tab, patch)}
          onReload={() => data.loadTickets(tab)}
          extra={raiseButton}
        />
      }
      summary={
        <TicketStatusSummary
          counts={store.statusCounts}
          breachedCount={store.breachedCount}
          activeStatuses={filters[tab].statuses}
          onToggle={toggleStatus}
        />
      }
      table={
        <TicketTable
          rows={store.rows}
          loading={store.rowsLoading}
          total={store.totalElements}
          page={filters[tab].page}
          pageSize={filters[tab].size}
          onPageChange={(page, size) => store.patchFilter(tab, { page, size })}
          onOpen={handleOpen}
          onClaim={options.agentView ? handleClaim : undefined}
          claiming={store.acting}
          showRequester={tab !== 'my'}
          emptyText={options.emptyText}
        />
      }
    />
  );

  const tabItems = [
    {
      key: 'my',
      label: 'My tickets',
      children: listTab('my', { emptyText: 'You have not raised any tickets' }),
    },
    ...(isAgent
      ? [
          {
            key: 'queue',
            label: 'Queue',
            children: listTab('queue', {
              agentView: true,
              emptyText: 'Nothing waiting in your queues',
            }),
          },
          {
            key: 'assigned',
            label: 'Assigned to me',
            children: listTab('assigned', {
              agentView: true,
              emptyText: 'Nothing assigned to you',
            }),
          },
        ]
      : []),
    ...(canSeeReports
      ? [
          {
            key: 'all',
            label: 'All tickets',
            children: listTab('all', { agentView: true, emptyText: 'No tickets' }),
          },
          {
            key: 'dashboard',
            label: 'Dashboard',
            children: (
              <TicketDashboardPanel
                dashboard={store.dashboard}
                loading={store.dashboardLoading}
                supportGroups={store.supportGroups}
                groupCode={dashboardGroup}
                range={dashboardRange}
                onGroupChange={setDashboardGroup}
                onRangeChange={setDashboardRange}
                onReload={() =>
                  data.loadDashboard(
                    dashboardGroup,
                    dashboardRange[0].format('YYYY-MM-DD'),
                    dashboardRange[1].format('YYYY-MM-DD'),
                  )
                }
                onOpenTicket={handleOpen}
              />
            ),
          },
        ]
      : []),
    ...(canManageConfig
      ? [
          {
            key: 'categories',
            label: 'Categories',
            children: (
              <CategoryAdminTable
                categories={store.categories}
                loading={store.categoriesLoading}
                canManage={canManageConfig}
                onCreate={() => store.openCategoryDrawer(null)}
                onEdit={(category) => store.openCategoryDrawer(category)}
                onDelete={async (code) => {
                  if (await data.deleteCategory(code)) {
                    data.loadCategories({ includeRestricted: true, withCounts: true });
                  }
                }}
                onReload={() => data.loadCategories({ includeRestricted: true, withCounts: true })}
              />
            ),
          },
          {
            key: 'groups',
            label: 'Support groups',
            children: (
              <SupportGroupAdminTable
                groups={store.supportGroups}
                loading={store.supportGroupsLoading}
                canManage={canManageConfig}
                onCreate={() => store.openGroupDrawer(null)}
                onEdit={(group) => store.openGroupDrawer(group)}
                onDelete={async (code) => {
                  if (await data.deleteSupportGroup(code)) data.loadSupportGroups(true);
                }}
                onReload={() => data.loadSupportGroups(true)}
              />
            ),
          },
        ]
      : []),
  ];

  const visibleKeys = tabItems.map((t) => t.key);
  const activeKey = visibleKeys.includes(activeTab) ? activeTab : visibleKeys[0];

  return (
    <ModuleAccessGate moduleCode={MODULE_CODE} appTitle="Tickets">
      <div className={`hrm-module-root ${styles.ticketRoot}`}>
        <CommonAppBar appTitle="Tickets" />
        <div className={styles.ticketContent}>
          <Tabs
            activeKey={activeKey}
            onChange={(key) => store.setActiveTab(key as TicketTabKey)}
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

        <RaiseTicketDrawer
          open={store.showRaiseDrawer}
          categories={store.categories}
          editTicket={store.editTicket}
          saving={store.saving}
          isAgent={isAgent}
          onClose={store.closeRaiseDrawer}
          onSubmit={handleRaise}
        />

        <TicketDetailDrawer
          open={store.detailOpen}
          ticket={store.selectedTicket}
          loading={store.selectedLoading}
          posting={store.acting}
          onClose={store.closeDetail}
          onAction={(kind: TicketActionKind) => store.setActiveAction(kind)}
          onClaim={handleClaim}
          onEdit={(ticket) => {
            store.closeDetail();
            store.openRaiseDrawer(ticket);
          }}
          onPostComment={handleComment}
          onDownload={(attachmentId, fileName) => {
            const ticketNumber = store.selectedTicket?.ticketNumber;
            if (ticketNumber) data.downloadAttachment(ticketNumber, attachmentId, fileName);
          }}
          onFetchAttachment={async (attachmentId) => {
            const ticketNumber = store.selectedTicket?.ticketNumber;
            if (!ticketNumber) return undefined;
            const attachment = await data.fetchAttachment(ticketNumber, attachmentId);
            return attachment?.contentBase64;
          }}
        />

        <TicketActionModal
          kind={store.activeAction}
          ticketNumber={store.selectedTicket?.ticketNumber}
          agents={store.assignableAgents}
          loading={store.acting}
          onCancel={() => store.setActiveAction(null)}
          onConfirm={handleAction}
        />

        <CategoryFormDrawer
          open={store.showCategoryDrawer}
          editCategory={store.editCategory}
          categories={store.categories}
          supportGroups={store.supportGroups}
          saving={store.saving}
          onClose={store.closeCategoryDrawer}
          onSubmit={handleSaveCategory}
        />

        <SupportGroupFormDrawer
          open={store.showGroupDrawer}
          editGroup={store.editGroup}
          saving={store.saving}
          onClose={store.closeGroupDrawer}
          onSubmit={handleSaveGroup}
        />
      </div>
    </ModuleAccessGate>
  );
};

export default HrmTicketLanding;
