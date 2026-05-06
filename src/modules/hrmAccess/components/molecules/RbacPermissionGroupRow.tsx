'use client';

import React from 'react';
import RbacPermissionCheckbox from '../atoms/RbacPermissionCheckbox';
import type { RbacPermissionGroupRowProps } from '../../types/ui.types';
import type { PermissionAction } from '../../types/api.types';
import { PERMISSION_ACTIONS, PERMISSION_ACTION_LABELS } from '../../utils/rbacConstants';
import { getObjectLabel } from '../../utils/moduleObjectRegistry';
import styles from '../../styles/RoleManagement.module.css';

const RbacPermissionGroupRow: React.FC<RbacPermissionGroupRowProps> = ({
  moduleCode,
  moduleName,
  objectName,
  permissions,
  selectedHandles,
  disabled,
  isRootObject = true,
  onChange,
}) => {
  const getPermissionForAction = (action: PermissionAction) =>
    permissions.find((p) => p.action === action);

  const label = objectName ? `  ${getObjectLabel(objectName)}` : moduleName;
  const isObjectRow = objectName !== null;

  return (
    <tr className={isObjectRow ? styles.objectRow : styles.moduleRow}>
      <td className={styles.permLabel}>{label}</td>
      {PERMISSION_ACTIONS.map((action) => {
        // Non-root objects don't expose Add or Delete at the object level.
        // Module-level (root) governs record create/delete; object-level
        // Edit covers in-section add/edit/delete buttons.
        if ((action === 'ADD' || action === 'DELETE') && !isRootObject) {
          return <td key={action} className={styles.permCell} />;
        }
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
