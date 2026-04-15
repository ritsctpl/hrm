'use client';

import React, { useState } from 'react';
import { Modal, notification, Button, Input, Form, Tabs } from 'antd';
import { PlusOutlined, CopyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
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
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneNewName, setCloneNewName] = useState('');
  const [cloning, setCloning] = useState(false);

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
    const isActiveValue = role.draft?.isActive ?? true;
    store.setRoleSaving(true);
    try {
      if (role.isCreating) {
        await HrmAccessService.createRole(payload);
        await HrmAccessService.toggleRoleStatus(site, payload.roleCode, isActiveValue, user?.id ?? '');
        notification.success({ message: 'Role created successfully.' });
        const refreshed = await HrmAccessService.fetchAllRoles(site);
        store.setRoles(refreshed);
        store.clearRoleDraft();
        store.selectRole(null);
      } else {
        await HrmAccessService.updateRole(role.selected!.handle, payload, user?.id ?? '');
        await HrmAccessService.toggleRoleStatus(site, payload.roleCode, isActiveValue, user?.id ?? '');
        notification.success({ message: 'Role updated successfully.' });
        const refreshed = await HrmAccessService.fetchAllRoles(site);
        store.setRoles(refreshed);
      }
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

  const handleDeleteRole = async (roleToDelete?: Role) => {
    const targetRole = roleToDelete || role.selected;
    if (!targetRole) return;

    if (targetRole.isSystemRole) {
      notification.warning({ message: 'System roles cannot be deleted.' });
      return;
    }

    try {
      const usersWithRole = await HrmAccessService.fetchUsersWithRole(site, targetRole.roleCode);
      const userCount = Array.isArray(usersWithRole) ? usersWithRole.length : 0;

      Modal.confirm({
        title: 'Delete Role',
        content:
          userCount > 0
            ? `This role is assigned to ${userCount} user(s). Deleting this role will revoke it from all assigned users. Are you sure?`
            : `Are you sure you want to delete "${targetRole.roleName}"?`,
        okText: 'Delete',
        okType: 'danger',
        onOk: async () => {
          try {
            if (userCount > 0) {
              await HrmAccessService.revokeByRole(site, targetRole.roleCode);
            }
            await HrmAccessService.deleteRole(site, targetRole.roleCode, user?.id ?? '');
            notification.success({
              message:
                userCount > 0
                  ? `Role deleted and revoked from ${userCount} user(s)`
                  : 'Role deleted successfully',
            });
            const refreshed = await HrmAccessService.fetchAllRoles(site);
            store.setRoles(refreshed);
            if (role.selected?.handle === targetRole.handle) {
              store.selectRole(null);
            }
          } catch (err: unknown) {
            notification.error({ message: (err as Error).message ?? 'Failed to delete role.' });
          }
        },
      });
    } catch (err: unknown) {
      notification.error({ message: 'Failed to check role assignments' });
    }
  };

  const handleToggleStatus = () => {
    const current = role.draft?.isActive ?? role.selected?.isActive ?? true;
    store.updateRoleDraft({ isActive: !current });
  };

  const handleSearch = async () => {
    store.setRoleLoading(true);
    try {
      const refreshed = await HrmAccessService.fetchAllRoles(site);
      store.setRoles(refreshed);
    } catch {
      notification.error({ message: 'Failed to load roles' });
    } finally {
      store.setRoleLoading(false);
    }
  };

  const handleCloneRole = async () => {
    if (!role.selected || !cloneNewName.trim()) return;
    setCloning(true);
    try {
      await HrmAccessService.cloneRole(site, role.selected.roleCode, cloneNewName.trim(), user?.id ?? '');
      notification.success({ message: 'Role cloned successfully.' });
      setCloneModalOpen(false);
      setCloneNewName('');
      const refreshed = await HrmAccessService.fetchAllRoles(site);
      store.setRoles(refreshed);
    } catch (err: unknown) {
      notification.error({ message: (err as Error).message ?? 'Failed to clone role.' });
    } finally {
      setCloning(false);
    }
  };

  const filteredRoles = role.list.filter((r) => {
    const q = role.searchText.toLowerCase();
    return r.roleCode.toLowerCase().includes(q) || r.roleName.toLowerCase().includes(q);
  });

  const showRightPanel = role.selected !== null || role.isCreating;

  return (
    <div className={styles.roleTemplate}>
      {!showRightPanel ? (
        <div className={styles.leftPanelFullWidth}>
          <div
            className={styles.leftToolbar}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <RbacSearchBar
              value={role.searchText}
              onChange={store.setRoleSearch}
              onSearch={handleSearch}
              placeholder="Search roles..."
              width={300}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="default" onClick={handleSearch} loading={role.isLoading}>
                Go
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => store.setRoleCreating(true)}
                className={styles.addButton}
              >
                New Role
              </Button>
            </div>
          </div>

          <RoleTable
            data={filteredRoles}
            isLoading={role.isLoading}
            selectedHandle={role.selected?.handle ?? null}
            searchText={role.searchText}
            onRowClick={handleSelectRole}
            onDelete={handleDeleteRole}
          />

          <div className={styles.tableFooter}>
            Showing {filteredRoles.length} of {role.list.length}
          </div>
        </div>
      ) : (
        <div className={styles.rightPanelFullWidth}>
          <div className={styles.stickyHeader}>
            <Button
              size="small"
              onClick={() => {
                store.selectRole(null);
                store.clearRoleDraft();
              }}
            >
              ← Back
            </Button>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#595959' }}>
              {role.isCreating ? 'Create New Role' : `Role: ${role.selected?.roleCode}`}
            </span>
          </div>
          <Tabs
            items={[
              {
                key: 'details',
                label: 'Role Details',
                children: (
                  <RoleForm
                    draft={role.draft}
                    isCreating={role.isCreating}
                    isSaving={role.isSaving}
                    isDeleting={role.isDeleting}
                    errors={role.errors}
                    onChange={store.updateRoleDraft}
                    onSave={handleSaveRole}
                    onDelete={handleDeleteRole}
                    onToggleStatus={handleToggleStatus}
                  />
                ),
              },
              {
                key: 'permissions',
                label: 'Permissions',
                disabled: role.isCreating,
                children: (
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
                ),
              },
            ]}
          />
        </div>
      )}

      {/* Clone Role Modal */}
      <Modal
        title="Clone Role"
        open={cloneModalOpen}
        onOk={handleCloneRole}
        onCancel={() => { setCloneModalOpen(false); setCloneNewName(''); }}
        okText="Clone"
        confirmLoading={cloning}
      >
        <p>
          Cloning role <strong>{role.selected?.roleCode}</strong> with all its permissions.
        </p>
        <Form layout="vertical">
          <Form.Item label="New Role Name" required>
            <Input
              value={cloneNewName}
              onChange={(e) => setCloneNewName(e.target.value)}
              placeholder="Enter name for the cloned role"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagementTemplate;
