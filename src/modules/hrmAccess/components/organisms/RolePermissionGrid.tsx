'use client';

import React, { useMemo } from 'react';
import { Select, Button, Skeleton, Typography, Space } from 'antd';
import type { RolePermissionGridProps } from '../../types/ui.types';
import type { Permission } from '../../types/domain.types';
import type { PermissionAction } from '../../types/api.types';
import RbacPermissionGroupRow from '../molecules/RbacPermissionGroupRow';
import { getRootObjectCode } from '../../utils/moduleObjectRegistry';
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

  // Group permissions by moduleCode then objectName. The root object
  // (e.g., employee_module) acts as the module-level row — no synthetic
  // entries needed since root objects are real permission records.
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

              const rootCode = getRootObjectCode(moduleCode);
              const allObjKeys = objKeys.filter((k) => k !== '__module__');
              const rootKey = allObjKeys.find((k) => k === rootCode);
              const childObjKeys = allObjKeys.filter((k) => k !== rootCode);

              // Cascade: when ROOT object checkbox is toggled, cascade to
              // ALL child objects for the same action. Children independently
              // toggled do NOT cascade upward to the root.
              const handleRootToggle = (handle: string) => {
                const rootPerms = rootKey ? (modPerms[rootKey] ?? []) : [];
                const toggledPerm = rootPerms.find((p) => p.handle === handle);
                onToggle(handle);
                if (!toggledPerm) return;
                const willBeChecked = !selectedHandles.has(handle);
                for (const objKey of childObjKeys) {
                  const childPerm = (modPerms[objKey] ?? []).find(
                    (p) => p.action === toggledPerm.action,
                  );
                  if (!childPerm) continue;
                  const childIsChecked = selectedHandles.has(childPerm.handle);
                  if (willBeChecked && !childIsChecked) onToggle(childPerm.handle);
                  if (!willBeChecked && childIsChecked) onToggle(childPerm.handle);
                }
              };

              return (
                <React.Fragment key={moduleCode}>
                  {/* Module header */}
                  <tr className={styles.moduleRow}>
                    <td className={styles.permLabel}>{modName}</td>
                    {PERMISSION_ACTIONS.map((action) => (
                      <td key={action} className={styles.permCell}>
                        <span className={styles.permNA}>—</span>
                      </td>
                    ))}
                  </tr>
                  {/* Root object (Module Access) — cascade on click */}
                  {rootKey && (
                    <RbacPermissionGroupRow
                      key={`${moduleCode}-${rootKey}`}
                      moduleCode={moduleCode}
                      moduleName={modName}
                      objectName={rootKey}
                      permissions={modPerms[rootKey]}
                      selectedHandles={selectedHandles}
                      disabled={disabled}
                      onChange={handleRootToggle}
                    />
                  )}
                  {/* Child object rows — independent, no upward cascade */}
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
