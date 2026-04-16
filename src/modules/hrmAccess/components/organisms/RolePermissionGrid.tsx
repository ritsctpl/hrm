'use client';

import React, { useCallback, useMemo } from 'react';
import { Select, Button, Skeleton, Typography, Space } from 'antd';
import type { RolePermissionGridProps } from '../../types/ui.types';
import type { Permission } from '../../types/domain.types';
import type { PermissionAction } from '../../types/api.types';
import RbacPermissionGroupRow from '../molecules/RbacPermissionGroupRow';
import { PERMISSION_ACTIONS, PERMISSION_ACTION_LABELS } from '../../utils/rbacConstants';
import styles from '../../styles/RoleManagement.module.css';

const { Text } = Typography;

const RolePermissionGrid: React.FC<RolePermissionGridProps> = ({
  modules,
  allPermissions,
  selectedHandles,
  moduleFilter,
  disabled,
  isLoading,
  isSaving,
  onToggle,
  onModuleFilterChange,
  onSavePermissions,
}) => {
  const moduleOptions = useMemo(
    () => [
      { value: '', label: 'All Modules' },
      ...modules.map((m) => ({ value: m.moduleCode, label: m.moduleName })),
    ],
    [modules]
  );

  // Group permissions by moduleCode then objectName
  const grouped = useMemo(() => {
    const result: Record<string, Record<string, Permission[]>> = {};

    for (const perm of allPermissions) {
      if (moduleFilter && perm.moduleCode !== moduleFilter) continue;
      const mod = perm.moduleCode;
      const obj = perm.objectName ?? '__module__';
      if (!result[mod]) result[mod] = {};
      if (!result[mod][obj]) result[mod][obj] = [];
      result[mod][obj].push(perm);
    }

    return result;
  }, [allPermissions, moduleFilter]);

  const moduleCodes = Object.keys(grouped);

  const selectedCount = selectedHandles.size;
  const totalCount = allPermissions.length;

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className={styles.permissionGrid}>
      <div className={styles.permGridHeader}>
        <Space>
          <Text strong>
            Permissions ({selectedCount} of {totalCount})
          </Text>
          <Select
            value={moduleFilter ?? ''}
            onChange={(val) => onModuleFilterChange(val || null)}
            options={moduleOptions}
            style={{ width: 180 }}
            size="small"
          />
        </Space>
      </div>

      <div className={styles.permTableWrapper}>
        <table className={styles.permTable}>
          <thead>
            <tr>
              <th className={styles.permLabelHeader}>Module / Object</th>
              {PERMISSION_ACTIONS.map((action) => (
                <th key={action} className={styles.permActionHeader}>
                  {PERMISSION_ACTION_LABELS[action as PermissionAction]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moduleCodes.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.permNoData}>
                  No permissions available.
                </td>
              </tr>
            )}
            {moduleCodes.map((moduleCode) => {
              const modPerms = grouped[moduleCode];
              const modName =
                modules.find((m) => m.moduleCode === moduleCode)?.moduleName ?? moduleCode;
              const objKeys = Object.keys(modPerms);

              // Cascade handler: when a module-level checkbox is toggled,
              // also toggle ALL child object permissions for the same action.
              const handleModuleToggle = (handle: string) => {
                const modulePerms = modPerms['__module__'] ?? [];
                const toggledPerm = modulePerms.find((p) => p.handle === handle);
                if (!toggledPerm) {
                  onToggle(handle);
                  return;
                }
                const willBeChecked = !selectedHandles.has(handle);
                onToggle(handle);
                // Cascade to all child objects for the same action
                objKeys
                  .filter((k) => k !== '__module__')
                  .forEach((objKey) => {
                    const childPerm = modPerms[objKey].find(
                      (p) => p.action === toggledPerm.action,
                    );
                    if (!childPerm) return;
                    const childIsChecked = selectedHandles.has(childPerm.handle);
                    if (willBeChecked && !childIsChecked) onToggle(childPerm.handle);
                    if (!willBeChecked && childIsChecked) onToggle(childPerm.handle);
                  });
              };

              return (
                <React.Fragment key={moduleCode}>
                  {/* Module-level row — cascade toggles to child objects */}
                  <RbacPermissionGroupRow
                    moduleCode={moduleCode}
                    moduleName={modName}
                    objectName={null}
                    permissions={modPerms['__module__'] ?? []}
                    selectedHandles={selectedHandles}
                    disabled={disabled}
                    onChange={handleModuleToggle}
                  />
                  {/* Object-level rows */}
                  {objKeys
                    .filter((k) => k !== '__module__')
                    .map((objKey) => (
                      <RbacPermissionGroupRow
                        key={`${moduleCode}-${objKey}`}
                        moduleCode={moduleCode}
                        moduleName={modName}
                        objectName={objKey}
                        permissions={modPerms[objKey]}
                        selectedHandles={selectedHandles}
                        disabled={disabled}
                        onChange={onToggle}
                      />
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <div className={styles.permSaveBar}>
          <Button
            type="primary"
            onClick={onSavePermissions}
            loading={isSaving}
            disabled={isSaving}
            size="small"
          >
            Save Permissions
          </Button>
        </div>
      )}
    </div>
  );
};

export default RolePermissionGrid;
