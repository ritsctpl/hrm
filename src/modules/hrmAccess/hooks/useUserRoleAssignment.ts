import { useCallback, useRef } from 'react';
import { notification } from 'antd';
import { useHrmAccessStore } from '../stores/hrmAccessStore';
import { HrmAccessService } from '../services/hrmAccessService';
import { validateAssignment } from '../utils/rbacValidations';
import { getAvatarInitials } from '../utils/rbacTransformations';
import type { KeycloakUserSummaryUI } from '../types/ui.types';
import { USER_SEARCH_DEBOUNCE_MS } from '../utils/rbacConstants';

export function useUserRoleAssignment(site: string, userId: string) {
  const store = useHrmAccessStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (text: string) => {
      store.setUserSearchText(text);

      if (timerRef.current) clearTimeout(timerRef.current);
      if (!text.trim()) {
        store.setUserSearchResults([]);
        return;
      }

      store.setSearchingUsers(true);
      timerRef.current = setTimeout(async () => {
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

  const selectUser = useCallback(
    async (userIdArg: string, userName: string, userEmail: string) => {
      store.selectUser(userIdArg, userName, userEmail);
      store.setLoadingAssignments(true);
      try {
        const assignments = await HrmAccessService.fetchAssignmentsForUser(site, userIdArg);
        store.setUserAssignments(assignments);
      } catch {
        notification.error({ message: 'Failed to load user assignments.' });
        store.setLoadingAssignments(false);
      }
    },
    [site, store]
  );

  const assignRole = useCallback(async () => {
    const { userAssignment } = useHrmAccessStore.getState();
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
        assignedBy: userId,
      });
      notification.success({ message: 'Role assigned.' });
      store.clearAssignmentDraft();
      const refreshed = await HrmAccessService.fetchAssignmentsForUser(
        site,
        userAssignment.selectedUserId!
      );
      store.setUserAssignments(refreshed);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Assignment failed.' });
    } finally {
      store.setAssigning(false);
    }
  }, [site, userId, store]);

  const revokeRole = useCallback(
    async (assignmentHandle: string) => {
      const { userAssignment } = useHrmAccessStore.getState();
      const active = userAssignment.assignments.filter((a) => a.assignmentStatus === 'ACTIVE');
      const target = active.find((a) => a.handle === assignmentHandle);

      if (target?.roleCode === 'SUPER_ADMIN' && active.length === 1) {
        notification.warning({ message: 'Cannot remove the last Super Admin assignment.' });
        return;
      }

      store.setRevoking(true);
      try {
        await HrmAccessService.revokeRoleFromUser(site, assignmentHandle, userId);
        notification.success({ message: 'Role revoked.' });
        const refreshed = await HrmAccessService.fetchAssignmentsForUser(
          site,
          userAssignment.selectedUserId!
        );
        store.setUserAssignments(refreshed);
      } catch (err: unknown) {
        notification.error({ message: (err as Error).message ?? 'Revoke failed.' });
      } finally {
        store.setRevoking(false);
      }
    },
    [site, userId, store]
  );

  return { handleSearchChange, selectUser, assignRole, revokeRole };
}
