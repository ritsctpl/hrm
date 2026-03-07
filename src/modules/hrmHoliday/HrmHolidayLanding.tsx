'use client';

import { useEffect } from 'react';
import { parseCookies } from 'nookies';
import { message } from 'antd';
import CommonAppBar from '@/components/CommonAppBar';
import HolidayGroupSearchBar from './components/molecules/HolidayGroupSearchBar';
import HolidaysMasterDetail from './components/templates/HolidaysMasterDetail';
import HolidayGroupsTable from './components/organisms/HolidayGroupsTable';
import HrmHolidayScreen from './HrmHolidayScreen';
import GroupCreateModal from './components/organisms/GroupCreateModal';
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

  const {
    groups,
    groupsLoading,
    groupsError,
    searchParams,
    selectedGroup,
    showGroupCreateModal,
    showDuplicateModal,
    setGroups,
    setGroupsLoading,
    setGroupsError,
    selectGroup,
    setSearchParams,
    openGroupCreateModal,
    closeGroupCreateModal,
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
          requestingUserRole: userRole,
          buHandle: searchParams.buHandle,
        });
        const groups = Array.isArray(res) ? res : [];
        setGroups(groups.map((g: HolidayGroup) => ({ ...g, mappings: g.mappings ?? [] })));
      } catch {
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

  return (
    <div className={styles.landing}>
      <CommonAppBar appTitle="Holiday Management" />
      <HolidayGroupSearchBar
        searchParams={searchParams}
        onSearchChange={(params) => setSearchParams(params)}
        onNewGroup={permissions.canCreate ? openGroupCreateModal : undefined}
        onDuplicateYear={
          permissions.canCreate && selectedGroup ? openDuplicateModal : undefined
        }
        canManageSettings={permissions.canManageSettings}
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
