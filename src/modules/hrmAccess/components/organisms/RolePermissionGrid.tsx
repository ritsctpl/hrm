'use client';

import React, { useMemo } from 'react';
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

  // Group permissions by moduleCode then objectName. If a module has
  // object-level records but NO module-level records (objectName=null),
  // inject synthetic __module__ entries so the module row always renders
  // checkboxes — even when the backend hasn't created null-object records.
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

    // Inject synthetic module-level entries where missing
    for (const mod of Object.keys(result)) {
      if (!result[mod]['__module__'] || result[mod]['__module__'].length === 0) {
        const modName = modules.find((m) => m.moduleCode === mod)?.moduleName ?? mod;
        result[mod]['__module__'] = PERMISSION_ACTIONS.map((action) => ({
          handle: `__synthetic__${mod}__${action}`,
          site: '',
          moduleCode: mod,
          moduleName: modName,
          objectName: null,
          action: action as Permission['action'],
          isDefault: false,
          active: 1,
          createdDateTime: '',
          createdBy: '',
        }));
      }
    }

    return result;
  }, [allPermissions, moduleFilter, modules]);

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

              return (
                <React.Fragment key={moduleCode}>
                  {/* Module-level row — independent checkboxes from the
                      __module__ permission records. These are separate from
                      object rows: checking an object's ADD does NOT affect
                      the module-level ADD and vice versa. */}
                  <RbacPermissionGroupRow
                    moduleCode={moduleCode}
                    moduleName={modName}
                    objectName={null}
                    permissions={modPerms['__module__'] ?? []}
                    selectedHandles={selectedHandles}
                    disabled={disabled}
                    onChange={onToggle}
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
