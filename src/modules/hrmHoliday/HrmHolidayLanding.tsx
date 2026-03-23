'use client';

import { useEffect } from 'react';
import { parseCookies } from 'nookies';
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
import type { HolidayGroup } from './types/domain.types';
import styles from './styles/HrmHoliday.module.css';

export default function HrmHolidayLanding() {
  const cookies = parseCookies();
  const site = cookies.site ?? '';
  const userRole = cookies.userRole ?? 'EMPLOYEE';
  const username = cookies.username ?? 'system';

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

  useEffect(() => {
    const fetchGroups = async () => {
      if (!site) return;
      setGroupsLoading(true);
      setGroupsError(null);
      try {
        const res = await HrmHolidayService.listGroups({
          site,
          year: searchParams.year,
          status: searchParams.status,
          requestingUserRole: '',
          buHandle: searchParams.buHandle,
        });
        
        // Handle both wrapped and unwrapped responses
        const data = res?.data || res;
        const groups = Array.isArray(data) ? data : [];
        setGroups(groups.map((g: HolidayGroup) => ({ ...g, mappings: g.mappings ?? [] })));
      } catch (error) {
        console.error('Failed to load holiday groups:', error);
        const errMsg = 'Failed to load holiday groups';
        setGroupsError(errMsg);
        message.error(errMsg);
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, [site, searchParams.year, searchParams.status, searchParams.buHandle, userRole]);

  const handleGroupCreated = (group: HolidayGroup) => {
    closeGroupCreateModal();
    setGroups([group, ...groups]);
    selectGroup(group);
  };

  const handleDuplicated = (handle: string) => {
    closeDuplicateModal();
    message.success('Group duplicated successfully');
    // Refresh by re-triggering the effect via setSearchParams no-op
    setSearchParams({ year: searchParams.year });
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
            site,
            deletedBy: username,
          });
          
          message.success('Holiday group deleted successfully');
          setGroups(groups.filter(g => g.handle !== selectedGroup.handle));
          selectGroup(null);
        } catch (error) {
          console.error('Failed to delete holiday group:', error);
          message.error('Failed to delete holiday group');
        }
      },
    });
  };

  return (
    <div className={styles.landing}>
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
      />

      <HolidaysMasterDetail>
        <HolidayGroupsTable
          groups={groups}
          loading={groupsLoading}
          error={groupsError}
          selectedHandle={selectedGroup?.handle}
          onRowClick={selectGroup}
        />

        {selectedGroup ? (
          <HrmHolidayScreen group={selectedGroup} site={site} permissions={permissions} />
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
            message.success('Holiday created successfully');
            // Refresh the selected group if one is selected
            if (selectedGroup) {
              setSearchParams({ year: searchParams.year });
            }
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
  );
}
