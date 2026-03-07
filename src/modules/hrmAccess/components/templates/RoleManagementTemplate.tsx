'use client';

import React from 'react';
import { Modal, notification, Button } from 'antd';
import PlusIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';
import RbacSearchBar from '../molecules/RbacSearchBar';
import RbacEmptyState from '../atoms/RbacEmptyState';
import RoleTable from '../organisms/RoleTable';
import RoleForm from '../organisms/RoleForm';
import RolePermissionGrid from '../organisms/RolePermissionGrid';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import { HrmAccessService } from '../../services/hrmAccessService';
import { validateRole } from '../../utils/rbacValidations';
import { mapRoleDraftToRequest, buildPermissionAssignRequest } from '../../utils/rbacTransformations';
import type { Role } from '../../types/domain.types';
import type { RoleManagementTemplateProps } from '../../types/ui.types';
import styles from '../../styles/RoleManagement.module.css';

const RoleManagementTemplate: React.FC<RoleManagementTemplateProps> = ({ site, user }) => {
  const store = useHrmAccessStore();
  const { role, permission } = store;

  const handleSelectRole = async (selectedRole: Role) => {
    store.selectRole(selectedRole);
    store.setLoadingPermissions(true);
    try {
      const rolePerms = await HrmAccessService.fetchPermissionsForRole(site, selectedRole.roleCode);
      store.setRolePermissions(rolePerms);
    } catch {
      notification.error({ message: 'Failed to load permissions.' });
      store.setLoadingPermissions(false);
    }
  };

  const handleSaveRole = async () => {
    const errors = validateRole(role.draft);
    if (Object.keys(errors).length > 0) {
      store.setRoleErrors(errors);
      return;
    }
    const payload = mapRoleDraftToRequest(role.draft!, site, user?.id ?? '');
    store.setRoleSaving(true);
    try {
      if (role.isCreating) {
        await HrmAccessService.createRole(payload);
        notification.success({ message: 'Role created successfully.' });
      } else {
        await HrmAccessService.updateRole(role.selected!.handle, payload, user?.id ?? '');
        notification.success({ message: 'Role updated successfully.' });
      }
      const refreshed = await HrmAccessService.fetchAllRoles(site);
      store.setRoles(refreshed);
      store.clearRoleDraft();
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to save role.' });
    } finally {
      store.setRoleSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!role.selected) return;
    const payload = buildPermissionAssignRequest(
      site,
      role.selected.roleCode,
      permission.selectedPermissionHandles,
      user?.id ?? ''
    );
    store.setSavingPermissions(true);
    try {
      await HrmAccessService.removeAllPermissionsFromRole(site, role.selected.roleCode, user?.id ?? '');
      if (payload.permissions.length > 0) {
        await HrmAccessService.assignPermissionsToRole(payload);
      }
      notification.success({ message: 'Permissions saved.' });
      const refreshed = await HrmAccessService.fetchAllRoles(site);
      store.setRoles(refreshed);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to save permissions.' });
    } finally {
      store.setSavingPermissions(false);
    }
  };

  const handleDeleteRole = () => {
    if (role.selected?.isSystemRole) {
      notification.warning({ message: 'System roles cannot be deleted.' });
      return;
    }
    Modal.confirm({
      title: 'Delete Role',
      content: `Are you sure you want to delete "${role.selected?.roleCode}"? This action cannot be undone.`,
      okType: 'danger',
      okText: 'Delete',
      onOk: async () => {
        store.setRoleDeleting(true);
        try {
          await HrmAccessService.deleteRole(site, role.selected!.roleCode, user?.id ?? '');
          notification.success({ message: 'Role deleted.' });
          const refreshed = await HrmAccessService.fetchAllRoles(site);
          store.setRoles(refreshed);
          store.selectRole(null);
        } catch (err: unknown) {
          notification.error({ message: (err as Error).message ?? 'Failed to delete role.' });
        } finally {
          store.setRoleDeleting(false);
        }
      },
    });
  };

  const filteredRoles = role.list.filter((r) => {
    const q = role.searchText.toLowerCase();
    return r.roleCode.toLowerCase().includes(q) || r.roleName.toLowerCase().includes(q);
  });

  const showRightPanel = role.selected !== null || role.isCreating;

  return (
    <div className={styles.roleTemplate}>
      <div className={styles.leftPanel}>
        <div className={styles.leftToolbar}>
          <RbacSearchBar
            value={role.searchText}
            onChange={store.setRoleSearch}
            placeholder="Search roles..."
          />
          <Button
            type="primary"
            icon={<PlusIcon fontSize="small" />}
            onClick={() => store.setRoleCreating(true)}
            className={styles.addButton}
          >
            Add Role
          </Button>
        </div>

        <RoleTable
          data={filteredRoles}
          isLoading={role.isLoading}
          selectedHandle={role.selected?.handle ?? null}
          searchText={role.searchText}
          onRowClick={handleSelectRole}
        />

        <div className={styles.tableFooter}>
          Showing {filteredRoles.length} of {role.list.length}
        </div>
      </div>

      <div className={styles.rightPanel}>
        {showRightPanel ? (
          <>
            <RoleForm
              draft={role.draft}
              isCreating={role.isCreating}
              isSaving={role.isSaving}
              isDeleting={role.isDeleting}
              errors={role.errors}
              onChange={store.updateRoleDraft}
              onSave={handleSaveRole}
              onDelete={handleDeleteRole}
              onToggleStatus={() => store.updateRoleDraft({ isActive: !role.draft?.isActive })}
            />
            {!role.isCreating && (
              <RolePermissionGrid
                modules={permission.allModules}
                allPermissions={permission.allPermissions}
                selectedHandles={permission.selectedPermissionHandles}
                moduleFilter={permission.moduleFilter}
                disabled={role.selected?.isSystemRole ?? false}
                isLoading={permission.isLoadingPermissions}
                isSaving={permission.isSavingPermissions}
                onToggle={store.togglePermission}
                onModuleFilterChange={store.setPermissionModuleFilter}
                onSavePermissions={handleSavePermissions}
              />
            )}
          </>
        ) : (
          <RbacEmptyState
            icon={<SecurityIcon style={{ fontSize: 40, color: '#8c8c8c' }} />}
            title="No Role Selected"
            description="Select a role from the list or create a new one."
          />
        )}
      </div>
    </div>
  );
};

export default RoleManagementTemplate;
