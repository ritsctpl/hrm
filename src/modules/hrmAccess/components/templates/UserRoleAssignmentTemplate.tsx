'use client';

import React, { useCallback } from 'react';
import { notification, Typography } from 'antd';
import PersonIcon from '@mui/icons-material/Person';
import UserSearchPanel from '../organisms/UserSearchPanel';
import UserRoleAssignmentForm from '../organisms/UserRoleAssignmentForm';
import UserRoleHistoryPanel from '../organisms/UserRoleHistoryPanel';
import RbacEmptyState from '../atoms/RbacEmptyState';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import { HrmAccessService } from '../../services/hrmAccessService';
import { validateAssignment } from '../../utils/rbacValidations';
import { getAvatarInitials } from '../../utils/rbacTransformations';
import type { UserRoleAssignmentTemplateProps } from '../../types/ui.types';
import type { KeycloakUserSummaryUI } from '../../types/ui.types';
import { USER_SEARCH_DEBOUNCE_MS } from '../../utils/rbacConstants';
import styles from '../../styles/UserRoleAssignment.module.css';

const { Text } = Typography;

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const UserRoleAssignmentTemplate: React.FC<UserRoleAssignmentTemplateProps> = ({ site, user }) => {
  const store = useHrmAccessStore();
  const { userAssignment, role } = store;

  const handleSearchChange = useCallback(
    (text: string) => {
      store.setUserSearchText(text);

      if (searchTimer) clearTimeout(searchTimer);
      if (!text.trim()) {
        store.setUserSearchResults([]);
        return;
      }

      store.setSearchingUsers(true);
      searchTimer = setTimeout(async () => {
        try {
          const results = await HrmAccessService.searchKeycloakUsers(site, text.trim());
          const mapped: KeycloakUserSummaryUI[] = results.map((u) => ({
            id: u.id,
            displayName: `${u.firstName} ${u.lastName}`.trim() || u.username,
            email: u.email,
            avatarInitials: getAvatarInitials(`${u.firstName} ${u.lastName}`.trim() || u.username),
          }));
          store.setUserSearchResults(mapped);
        } catch {
          notification.error({ message: 'Failed to search users.' });
          store.setSearchingUsers(false);
        }
      }, USER_SEARCH_DEBOUNCE_MS);
    },
    [site, store]
  );

  const handleSelectUser = async (userId: string, userName: string, userEmail: string) => {
    store.selectUser(userId, userName, userEmail);
    store.setLoadingAssignments(true);
    try {
      const assignments = await HrmAccessService.fetchAssignmentsForUser(site, userId);
      store.setUserAssignments(assignments);
    } catch {
      notification.error({ message: 'Failed to load user assignments.' });
      store.setLoadingAssignments(false);
    }
  };

  const handleAssign = async () => {
    const draft = userAssignment.assignmentDraft;
    const errors = validateAssignment(draft);
    if (Object.keys(errors).length > 0) {
      store.setAssignmentErrors(errors);
      return;
    }

    store.setAssigning(true);
    try {
      await HrmAccessService.assignRoleToUser({
        site,
        userId: userAssignment.selectedUserId!,
        roleCode: draft!.roleCode!,
        effectiveFrom: draft!.effectiveFrom!,
        effectiveTo: draft?.effectiveTo ?? null,
        assignmentNotes: draft?.assignmentNotes ?? null,
        assignedBy: user?.id ?? '',
      });
      notification.success({ message: 'Role assigned successfully.' });
      store.clearAssignmentDraft();
      // Refresh assignments
      const refreshed = await HrmAccessService.fetchAssignmentsForUser(
        site,
        userAssignment.selectedUserId!
      );
      store.setUserAssignments(refreshed);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to assign role.' });
    } finally {
      store.setAssigning(false);
    }
  };

  const handleRevoke = async (assignmentHandle: string) => {
    const activeAssignments = (userAssignment.assignments ?? []).filter(
      (a) => a.assignmentStatus === 'ACTIVE'
    );
    const target = activeAssignments.find((a) => a.handle === assignmentHandle);

    if (target?.roleCode === 'SUPER_ADMIN' && activeAssignments.length === 1) {
      notification.warning({ message: 'Cannot remove the last Super Admin assignment.' });
      return;
    }

    store.setRevoking(true);
    try {
      await HrmAccessService.revokeRoleFromUser(site, assignmentHandle, user?.id ?? '');
      notification.success({ message: 'Role revoked.' });
      const refreshed = await HrmAccessService.fetchAssignmentsForUser(
        site,
        userAssignment.selectedUserId!
      );
      store.setUserAssignments(refreshed);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to revoke role.' });
    } finally {
      store.setRevoking(false);
    }
  };

  const hasUserSelected = !!userAssignment.selectedUserId;

  return (
    <div className={styles.assignmentTemplate}>
      <div className={styles.leftPanel}>
        <UserSearchPanel
          searchText={userAssignment.userSearchText}
          onSearchChange={handleSearchChange}
          searchResults={userAssignment.userSearchResults}
          isSearching={userAssignment.isSearchingUsers}
          selectedUserId={userAssignment.selectedUserId}
          onSelectUser={handleSelectUser}
        />
      </div>

      <div className={styles.rightPanel}>
        {hasUserSelected ? (
          <>
            <div className={styles.selectedUserInfo}>
              <Text strong>{userAssignment.selectedUserName}</Text>
              <Text type="secondary">{userAssignment.selectedUserEmail}</Text>
            </div>

            <UserRoleHistoryPanel
              assignments={userAssignment.assignments}
              isLoading={userAssignment.isLoadingAssignments}
              isRevoking={userAssignment.isRevoking}
              onRevoke={handleRevoke}
            />

            <UserRoleAssignmentForm
              roles={role.list}
              draft={userAssignment.assignmentDraft}
              isAssigning={userAssignment.isAssigning}
              errors={userAssignment.errors}
              onChange={(patch) =>
                store.updateAssignmentDraft(patch as Parameters<typeof store.updateAssignmentDraft>[0])
              }
              onAssign={handleAssign}
            />
          </>
        ) : (
          <RbacEmptyState
            icon={<PersonIcon style={{ fontSize: 40, color: '#8c8c8c' }} />}
            title="No User Selected"
            description="Search and select a user to view and manage their role assignments."
          />
        )}
      </div>
    </div>
  );
};

export default UserRoleAssignmentTemplate;
