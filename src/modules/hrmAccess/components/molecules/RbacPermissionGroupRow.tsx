'use client';

import React from 'react';
import RbacPermissionCheckbox from '../atoms/RbacPermissionCheckbox';
import type { RbacPermissionGroupRowProps } from '../../types/ui.types';
import type { PermissionAction } from '../../types/api.types';
import { PERMISSION_ACTIONS, PERMISSION_ACTION_LABELS } from '../../utils/rbacConstants';
import styles from '../../styles/RoleManagement.module.css';

const RbacPermissionGroupRow: React.FC<RbacPermissionGroupRowProps> = ({
  moduleCode,
  moduleName,
  objectName,
  permissions,
  selectedHandles,
  disabled,
  onChange,
}) => {
  const getPermissionForAction = (action: PermissionAction) =>
    permissions.find((p) => p.action === action);

  const label = objectName ? `  ${objectName}` : moduleName;
  const isObjectRow = objectName !== null;

  return (
    <tr className={isObjectRow ? styles.objectRow : styles.moduleRow}>
      <td className={styles.permLabel}>{label}</td>
      {PERMISSION_ACTIONS.map((action) => {
        const perm = getPermissionForAction(action);
        return (
          <td key={action} className={styles.permCell}>
            {perm ? (
              <RbacPermissionCheckbox
                checked={selectedHandles.has(perm.handle)}
                disabled={disabled}
                onChange={() => onChange(perm.handle)}
                label={`${PERMISSION_ACTION_LABELS[action]} - ${label}`}
              />
            ) : (
              <span className={styles.permNA}>—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
};

export default RbacPermissionGroupRow;
