import { useCallback } from 'react';
import { notification } from 'antd';
import { useHrmAccessStore } from '../stores/hrmAccessStore';
import { HrmAccessService } from '../services/hrmAccessService';
import { validateRole } from '../utils/rbacValidations';
import { mapRoleDraftToRequest, buildPermissionAssignRequest } from '../utils/rbacTransformations';
import type { Role } from '../types/domain.types';

export function useRoleManagement(organizationId: string, userId: string) {
  const store = useHrmAccessStore();

  const loadRoles = useCallback(async () => {
    if (!organizationId) return;
    store.setRoleLoading(true);
    try {
      const roles = await HrmAccessService.fetchAllRoles(organizationId);
      store.setRoles(roles);
    } catch {
      notification.error({ message: 'Failed to load roles.' });
      store.setRoleLoading(false);
    }
  }, [organizationId, store]);

  const selectRole = useCallback(
    async (selectedRole: Role) => {
      store.selectRole(selectedRole);
      store.setLoadingPermissions(true);
      try {
        const perms = await HrmAccessService.fetchPermissionsForRole(organizationId, selectedRole.roleCode);
        store.setRolePermissions(perms);
      } catch {
        notification.error({ message: 'Failed to load permissions.' });
        store.setLoadingPermissions(false);
      }
    },
    [organizationId, store]
  );

  const saveRole = useCallback(async () => {
    const { role } = useHrmAccessStore.getState();
    const errors = validateRole(role.draft);
    if (Object.keys(errors).length > 0) {
      store.setRoleErrors(errors);
      return;
    }
    const payload = mapRoleDraftToRequest(role.draft!, organizationId, userId);
    store.setRoleSaving(true);
    try {
      if (role.isCreating) {
        await HrmAccessService.createRole(payload);
        notification.success({ message: 'Role created.' });
      } else {
        await HrmAccessService.updateRole(role.selected!.handle, payload, userId);
        notification.success({ message: 'Role updated.' });
      }
      const refreshed = await HrmAccessService.fetchAllRoles(organizationId);
      store.setRoles(refreshed);
      store.clearRoleDraft();
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Save failed.' });
    } finally {
      store.setRoleSaving(false);
    }
  }, [organizationId, userId, store]);

  const savePermissions = useCallback(async () => {
    const { role, permission } = useHrmAccessStore.getState();
    if (!role.selected) return;
    const payload = buildPermissionAssignRequest(
      organizationId,
      role.selected.roleCode,
      permission.selectedPermissionHandles,
      userId
    );
    store.setSavingPermissions(true);
    try {
      await HrmAccessService.removeAllPermissionsFromRole(organizationId, role.selected.roleCode, userId);
      if (payload.permissions.length > 0) {
        await HrmAccessService.assignPermissionsToRole(payload);
      }
      notification.success({ message: 'Permissions saved.' });
      const refreshed = await HrmAccessService.fetchAllRoles(organizationId);
      store.setRoles(refreshed);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to save permissions.' });
    } finally {
      store.setSavingPermissions(false);
    }
  }, [organizationId, userId, store]);

  const deleteRole = useCallback(async () => {
    const { role } = useHrmAccessStore.getState();
    if (!role.selected || role.selected.isSystemRole) return;
    store.setRoleDeleting(true);
    try {
      await HrmAccessService.deleteRole(organizationId, role.selected.roleCode, userId);
      notification.success({ message: 'Role deleted.' });
      const refreshed = await HrmAccessService.fetchAllRoles(organizationId);
      store.setRoles(refreshed);
      store.selectRole(null);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Delete failed.' });
    } finally {
      store.setRoleDeleting(false);
    }
  }, [organizationId, userId, store]);

  return { loadRoles, selectRole, saveRole, savePermissions, deleteRole };
}
