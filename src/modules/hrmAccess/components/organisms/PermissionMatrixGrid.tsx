'use client';

import React, { useMemo } from 'react';
import { Skeleton, Tag, Tooltip } from 'antd';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import type { PermissionMatrixGridProps } from '../../types/ui.types';
import type { PermissionsMatrixResponse } from '../../types/api.types';
import { PERMISSION_ACTIONS } from '../../utils/rbacConstants';
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

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (filteredRows.length === 0) {
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
          {filteredRows.map((row: PermissionsMatrixResponse, rowIndex: number) => {
            const label = row.objectName
              ? `  > ${row.objectName}`
              : row.moduleName;
            const isObject = row.objectName !== null;

            return (
              <tr
                key={`row-${rowIndex}-${row.moduleCode}-${row.objectName ?? '__module__'}`}
                className={isObject ? styles.objectRow : styles.moduleRow}
              >
                <td className={styles.moduleLabel}>{label}</td>
                {visibleRoles.flatMap((role) =>
                  PERMISSION_ACTIONS.map((action) => {
                    const granted =
                      (row.action === action && row.roleAccess?.[role.roleCode]) ||
                      (row.rolesWithAccess?.includes(role.roleCode) ?? false);
                    return (
                      <td key={`${row.moduleCode}-${row.objectName ?? '__module__'}-${role.roleCode}-${action}`} className={styles.matrixCell}>
                        {granted ? (
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
