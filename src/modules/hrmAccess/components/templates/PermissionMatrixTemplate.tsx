'use client';

import React, { useEffect, useState } from 'react';
import { notification } from 'antd';
import PermissionMatrixToolbar from '../organisms/PermissionMatrixToolbar';
import PermissionMatrixGrid from '../organisms/PermissionMatrixGrid';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import { HrmAccessService } from '../../services/hrmAccessService';
import type { PermissionsMatrixResponse } from '../../types/api.types';
import styles from '../../styles/PermissionMatrix.module.css';

interface PermissionMatrixTemplateProps {
  organizationId: string;
  isActive?: boolean;
}

const PermissionMatrixTemplate: React.FC<PermissionMatrixTemplateProps> = ({ organizationId, isActive }) => {
  const store = useHrmAccessStore();
  const { permissionMatrix, permission, role } = store;

  const [rawMatrixData, setRawMatrixData] = useState<PermissionsMatrixResponse[]>([]);

  // Reload matrix data when tab becomes active
  useEffect(() => {
    if (!organizationId || !isActive) return;

    store.setMatrixLoading(true);
    HrmAccessService.fetchPermissionsMatrix(organizationId, null, null)
      .then((data) => {
        setRawMatrixData(data);
        store.setMatrixLoading(false);
      })
      .catch(() => {
        notification.error({ message: 'Failed to load permission matrix.' });
        store.setMatrixLoading(false);
      });
  }, [organizationId, isActive]);

  const handleExport = async () => {
    try {
      const blob = await HrmAccessService.exportRoles(organizationId, 'csv');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `permissions-matrix-${organizationId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notification.error({ message: 'Export failed.' });
    }
  };

  return (
    <div className={styles.matrixTemplate}>
      <PermissionMatrixToolbar
        modules={permission.allModules}
        roles={role.list}
        moduleFilter={permissionMatrix.moduleFilter}
        roleFilter={permissionMatrix.roleFilter}
        onModuleFilterChange={store.setMatrixModuleFilter}
        onRoleFilterChange={store.setMatrixRoleFilter}
        onExport={handleExport}
        isLoading={permissionMatrix.isLoading}
      />

      <PermissionMatrixGrid
        matrixData={rawMatrixData}
        roles={role.list}
        isLoading={permissionMatrix.isLoading}
        moduleFilter={permissionMatrix.moduleFilter}
        roleFilter={permissionMatrix.roleFilter}
      />
    </div>
  );
};

export default PermissionMatrixTemplate;
