'use client';

import React, { useMemo } from 'react';
import { Skeleton, Tag, Tooltip } from 'antd';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import type { PermissionMatrixGridProps } from '../../types/ui.types';
import type { PermissionsMatrixResponse } from '../../types/api.types';
import { PERMISSION_ACTIONS } from '../../utils/rbacConstants';
import { getObjectLabel } from '../../utils/moduleObjectRegistry';
import styles from '../../styles/PermissionMatrix.module.css';

const PermissionMatrixGrid: React.FC<PermissionMatrixGridProps> = ({
  matrixData,
  roles,
  isLoading,
  moduleFilter,
  roleFilter,
}) => {
  const filteredRows = useMemo(() => {
    return matrixData.filter((row: PermissionsMatrixResponse) => {
      if (moduleFilter && row.moduleCode !== moduleFilter) return false;
      return true;
    });
  }, [matrixData, moduleFilter]);

  const visibleRoles = useMemo(() => {
    if (roleFilter) return roles.filter((r) => r.roleCode === roleFilter);
    return roles;
  }, [roles, roleFilter]);

  // Create a map of moduleCode to moduleName for lookup
  const moduleNameMap = useMemo(() => {
    const map = new Map<string, string>();
    matrixData.forEach((row) => {
      if (row.moduleCode && row.moduleName) {
        map.set(row.moduleCode, row.moduleName);
      }
    });
    return map;
  }, [matrixData]);

  // Group permissions by module and object
  const groupedData = useMemo(() => {
    const groups = new Map<string, PermissionsMatrixResponse[]>();
    
    filteredRows.forEach((row) => {
      const key = `${row.moduleCode}::${row.objectName || '__module__'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    });
    
    return Array.from(groups.entries()).map(([key, permissions]) => {
      const [moduleCode, objectName] = key.split('::');
      return {
        moduleCode,
        objectName: objectName === '__module__' ? null : objectName,
        moduleName: permissions[0]?.moduleName || moduleNameMap.get(moduleCode) || moduleCode,
        permissions,
      };
    });
  }, [filteredRows, moduleNameMap]);

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (groupedData.length === 0) {
    return (
      <div className={styles.noData}>
        No permission data available. Select filters or load the matrix.
      </div>
    );
  }

  return (
    <div className={styles.matrixWrapper}>
      <table className={styles.matrixTable}>
        <thead>
          <tr>
            <th className={styles.moduleHeader} rowSpan={2}>
              Module / Object
            </th>
            {visibleRoles.map((role) => (
              <th
                key={`header-${role.roleCode}`}
                className={styles.roleHeader}
                colSpan={PERMISSION_ACTIONS.length}
              >
                <Tooltip title={role.roleName}>
                  <span>{role.roleCode}</span>
                </Tooltip>
              </th>
            ))}
          </tr>
          <tr>
            {visibleRoles.flatMap((role) =>
              PERMISSION_ACTIONS.map((action) => (
                <th key={`header-action-${role.roleCode}-${action}`} className={styles.actionHeader}>
                  {action.charAt(0)}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {groupedData.map((group, rowIndex) => {
            const label = group.objectName
              ? `${group.moduleName} > ${getObjectLabel(group.objectName)}`
              : group.moduleName;
            const isObject = group.objectName !== null;

            return (
              <tr
                key={`row-${rowIndex}-${group.moduleCode}-${group.objectName ?? '__module__'}`}
                className={isObject ? styles.objectRow : styles.moduleRow}
              >
                <td className={styles.moduleLabel}>{label}</td>
                {visibleRoles.flatMap((role) =>
                  PERMISSION_ACTIONS.map((action) => {
                    // Find if this role has this action for this module/object
                    const hasPermission = group.permissions.some((perm) => {
                      const actionMatch = perm.action === action;
                      const roleHasAccess = 
                        perm.roleAccess?.[role.roleCode] || 
                        perm.rolesWithAccess?.includes(role.roleCode) ||
                        false;
                      return actionMatch && roleHasAccess;
                    });
                    
                    return (
                      <td key={`${group.moduleCode}-${group.objectName ?? '__module__'}-${role.roleCode}-${action}`} className={styles.matrixCell}>
                        {hasPermission ? (
                          <CheckCircleOutlinedIcon
                            className={styles.grantedIcon}
                            fontSize="small"
                          />
                        ) : (
                          <span className={styles.deniedDot} />
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={styles.legend}>
        <Tag color="success">
          <CheckCircleOutlinedIcon fontSize="small" /> Granted
        </Tag>
        <span className={styles.legendItem}>
          <span className={styles.deniedDot} /> Not Granted
        </span>
        <span className={styles.legendKeys}>V=View &nbsp; A=Add &nbsp; E=Edit &nbsp; D=Delete</span>
      </div>
    </div>
  );
};

export default PermissionMatrixGrid;
