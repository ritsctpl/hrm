'use client';

import { useEffect, useMemo } from 'react';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { message, Modal } from 'antd';
import CommonAppBar from '@/components/CommonAppBar';
import HolidayGroupSearchBar from './components/molecules/HolidayGroupSearchBar';
import HolidaysMasterDetail from './components/templates/HolidaysMasterDetail';
import HolidayGroupsTable from './components/organisms/HolidayGroupsTable';
import HrmHolidayScreen from './HrmHolidayScreen';
import GroupCreateModal from './components/organisms/GroupCreateModal';
import GroupUpdateModal from './components/organisms/GroupUpdateModal';
import HolidayCreateModal from './components/organisms/HolidayCreateModal';
import DuplicateGroupModal from './components/organisms/DuplicateGroupModal';
import { useHrmHolidayStore } from './stores/hrmHolidayStore';
import { HrmHolidayService } from './services/hrmHolidayService';
import { useHolidayPermissions } from './hooks/useHolidayPermissions';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import { useEmployeeIdentity } from '../hrmAccess/hooks/useEmployeeIdentity';
import type { HolidayGroup } from './types/domain.types';
import styles from './styles/HrmHoliday.module.css';

export default function HrmHolidayLanding() {
  const cookies = parseCookies();
  const organizationId = getOrganizationId();
  const userRole = cookies.userRole ?? 'EMPLOYEE';
  const { employeeCode } = useEmployeeIdentity();
  const username = employeeCode || cookies.username || 'system';

  const {
    groups,
    groupsLoading,
    groupsError,
    searchParams,
    selectedGroup,
    showGroupCreateModal,
    showGroupUpdateModal,
    showHolidayCreateModal,
    showDuplicateModal,
    setGroups,
    setGroupsLoading,
    setGroupsError,
    selectGroup,
    setSearchParams,
    openGroupCreateModal,
    closeGroupCreateModal,
    openGroupUpdateModal,
    closeGroupUpdateModal,
    openHolidayCreateModal,
    closeHolidayCreateModal,
    openDuplicateModal,
    closeDuplicateModal,
  } = useHrmHolidayStore();

  const permissions = useHolidayPermissions(userRole);

  const fetchGroups = async () => {
    if (!organizationId) {
      message.error('Site not configured. Please log in again.');
      return;
    }
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      // Non-manager employees only see PUBLISHED groups — DRAFT and LOCKED
      // states are admin/manager surface area. Force the filter regardless
      // of whatever the (disabled) status dropdown currently holds.
      const effectiveStatus = permissions.seeDraftGroups
        ? searchParams.status
        : 'PUBLISHED';
      const res = await HrmHolidayService.listGroups({ organizationId,
        year: searchParams.year,
        status: effectiveStatus,
        requestingUserRole: userRole,
        buHandle: searchParams.buHandle,
        search: searchParams.search?.trim() || undefined,
      });

      // Handle both wrapped and unwrapped responses
      const data = res?.data || res;
      const groups = Array.isArray(data) ? data : [];

      setGroups(groups.map((g: HolidayGroup) => ({ ...g, mappings: g.mappings ?? [] })));

      // BUG-003 FIX: Clear selected group if it's not in the filtered results
      if (selectedGroup && !groups.find((g: HolidayGroup) => g.handle === selectedGroup.handle)) {
        selectGroup(null);
      }
    } catch (error) {
      const errMsg = 'Failed to load holiday groups';
      setGroupsError(errMsg);
      message.error(errMsg);
    } finally {
      setGroupsLoading(false);
    }
  };

  // Debounce search-driven refetches by 300ms so each keystroke doesn't
  // fire a request. Other filters (year / status / BU) refetch immediately.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups();
    }, 300);
    return () => clearTimeout(timer);
  }, [organizationId, searchParams.year, searchParams.status, searchParams.buHandle, searchParams.search, userRole]);

  // Client-side filter as a safety net — applies the search term against
  // groupName / groupCode / description even if the backend ignores the
  // `search` query param. Empty term passes everything through.
  const filteredGroups = useMemo(() => {
    const term = (searchParams.search ?? '').trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => {
      const haystack = [
        g.groupName,
        (g as { groupCode?: string }).groupCode,
        g.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [groups, searchParams.search]);

  const handleGroupCreated = (group: HolidayGroup) => {
    closeGroupCreateModal();
    setGroups([group, ...groups]);
    selectGroup(group);
  };

  const handleDuplicated = async (handle: string) => {
    closeDuplicateModal();
    message.success('Group duplicated successfully');
    await fetchGroups();
    const newGroup = useHrmHolidayStore.getState().groups.find((g) => g.handle === handle);
    if (newGroup) selectGroup(newGroup);
  };

  const handleEditGroup = () => {
    if (!selectedGroup) return;
    openGroupUpdateModal();
  };

  const handleGroupUpdated = (updatedGroup: HolidayGroup) => {
    closeGroupUpdateModal();
    setGroups(groups.map(g => g.handle === updatedGroup.handle ? updatedGroup : g));
    selectGroup(updatedGroup);
  };

  const handleDeleteGroup = () => {
    if (!selectedGroup) return;
    
    Modal.confirm({
      title: 'Delete Holiday Group',
      content: `Are you sure you want to delete "${selectedGroup.groupName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await HrmHolidayService.deleteGroup({
            handle: selectedGroup.handle,
            organizationId,
            deletedBy: username,
            deletedByRole: userRole,
          });
          
          message.success('Holiday group deleted successfully');
          setGroups(groups.filter(g => g.handle !== selectedGroup.handle));
          selectGroup(null);
        } catch (error) {
          message.error('Failed to delete holiday group');
        }
      },
    });
  };

  return (
    <ModuleAccessGate moduleCode="HRM_HOLIDAY" appTitle="Holiday Management">
    <div className={`hrm-module-root ${styles.landing}`}>
      <CommonAppBar appTitle="Holiday Management" />
      <HolidayGroupSearchBar
        searchParams={searchParams}
        onSearchChange={(params) => setSearchParams(params)}
        onNewGroup={openGroupCreateModal}
        onNewHoliday={openHolidayCreateModal}
        onEditGroup={selectedGroup ? () => handleEditGroup() : undefined}
        onDeleteGroup={selectedGroup ? () => handleDeleteGroup() : undefined}
        onDuplicateYear={selectedGroup ? openDuplicateModal : undefined}
        canManageSettings={permissions.canManageSettings}
        hasSelectedGroup={!!selectedGroup}
        canSeeDraftGroups={permissions.seeDraftGroups}
      />

      <HolidaysMasterDetail>
        <HolidayGroupsTable
          groups={filteredGroups}
          loading={groupsLoading}
          error={groupsError}
          selectedHandle={selectedGroup?.handle}
          onRowClick={selectGroup}
        />

        {selectedGroup ? (
          <HrmHolidayScreen group={selectedGroup} organizationId={organizationId} permissions={permissions} />
        ) : (
          <div className={styles.emptyRight}>
            <p>Select a holiday group to view details</p>
          </div>
        )}
      </HolidaysMasterDetail>

      {showGroupCreateModal && (
        <GroupCreateModal
          open={showGroupCreateModal}
          onClose={closeGroupCreateModal}
          onCreated={handleGroupCreated}
        />
      )}

      {showGroupUpdateModal && selectedGroup && (
        <GroupUpdateModal
          open={showGroupUpdateModal}
          group={selectedGroup}
          onClose={closeGroupUpdateModal}
          onUpdated={handleGroupUpdated}
        />
      )}

      {showHolidayCreateModal && (
        <HolidayCreateModal
          open={showHolidayCreateModal}
          groups={groups}
          onClose={closeHolidayCreateModal}
          onCreated={() => {
            closeHolidayCreateModal();
            // Clear selected group to close right panel
            selectGroup(null);
            // Refresh groups list to update counts
            fetchGroups();
          }}
        />
      )}

      {showDuplicateModal && selectedGroup && (
        <DuplicateGroupModal
          open={showDuplicateModal}
          sourceGroup={selectedGroup}
          onClose={closeDuplicateModal}
          onDuplicated={handleDuplicated}
        />
      )}
    </div>
    </ModuleAccessGate>
  );
}
