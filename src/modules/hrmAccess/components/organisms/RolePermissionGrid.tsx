'use client';

import React, { useMemo } from 'react';
import { Checkbox, Select, Button, Skeleton, Tooltip, Typography, Space } from 'antd';
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

              // Gather all child object keys (everything except __module__)
              const childObjKeys = objKeys.filter((k) => k !== '__module__');

              // For each action, collect every child permission handle.
              const childHandlesByAction: Record<string, string[]> = {};
              for (const action of PERMISSION_ACTIONS) {
                childHandlesByAction[action] = [];
                for (const objKey of childObjKeys) {
                  const p = modPerms[objKey]?.find((pm) => pm.action === action);
                  if (p) childHandlesByAction[action].push(p.handle);
                }
              }

              // Compute checked / indeterminate state per action for the
              // module-level "select all" row.
              const actionState = (action: string) => {
                const handles = childHandlesByAction[action] ?? [];
                if (handles.length === 0) return { checked: false, indeterminate: false, count: 0 };
                const checkedCount = handles.filter((h) => selectedHandles.has(h)).length;
                return {
                  checked: checkedCount === handles.length,
                  indeterminate: checkedCount > 0 && checkedCount < handles.length,
                  count: handles.length,
                };
              };

              // Select-all toggle: check all children if not all checked,
              // uncheck all if all are already checked.
              const handleSelectAll = (action: string) => {
                const handles = childHandlesByAction[action] ?? [];
                const { checked: allChecked } = actionState(action);
                for (const h of handles) {
                  const isChecked = selectedHandles.has(h);
                  if (allChecked && isChecked) onToggle(h);
                  if (!allChecked && !isChecked) onToggle(h);
                }
              };

              return (
                <React.Fragment key={moduleCode}>
                  {/* Module-level row — virtual select-all checkboxes */}
                  <tr className={styles.moduleRow}>
                    <td className={styles.permLabel}>{modName}</td>
                    {PERMISSION_ACTIONS.map((action) => {
                      const { checked, indeterminate, count } = actionState(action);
                      return (
                        <td key={action} className={styles.permCell}>
                          {count > 0 ? (
                            <Tooltip
                              title={`${checked ? 'Uncheck' : 'Check'} all ${PERMISSION_ACTION_LABELS[action as PermissionAction]} for ${modName}`}
                            >
                              <Checkbox
                                checked={checked}
                                indeterminate={indeterminate}
                                disabled={disabled}
                                onChange={() => handleSelectAll(action)}
                              />
                            </Tooltip>
                          ) : (
                            <span className={styles.permNA}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Object-level rows */}
                  {childObjKeys.map((objKey) => (
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
