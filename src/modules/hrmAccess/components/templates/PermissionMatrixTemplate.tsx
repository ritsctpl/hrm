'use client';

import React, { useEffect } from 'react';
import { notification } from 'antd';
import PermissionMatrixToolbar from '../organisms/PermissionMatrixToolbar';
import PermissionMatrixGrid from '../organisms/PermissionMatrixGrid';
import { useHrmAccessStore } from '../../stores/hrmAccessStore';
import { HrmAccessService } from '../../services/hrmAccessService';
import type { PermissionMatrixTemplateProps } from '../../types/ui.types';
import type { PermissionsMatrixResponse } from '../../types/api.types';
import styles from '../../styles/PermissionMatrix.module.css';

// Local state for raw matrix rows since store holds transformed data
import { useState } from 'react';

const PermissionMatrixTemplate: React.FC<PermissionMatrixTemplateProps> = ({ site }) => {
  const store = useHrmAccessStore();
  const { permissionMatrix, permission, role } = store;

  const [rawMatrixData, setRawMatrixData] = useState<PermissionsMatrixResponse[]>([]);

  useEffect(() => {
    if (!site) return;

    store.setMatrixLoading(true);
    HrmAccessService.fetchPermissionsMatrix(site, null, null)
      .then((data) => {
        setRawMatrixData(data);
        store.setMatrixLoading(false);
      })
      .catch(() => {
        notification.error({ message: 'Failed to load permission matrix.' });
        store.setMatrixLoading(false);
      });
  }, [site]);

  const handleExport = async () => {
    try {
      const blob = await HrmAccessService.exportRoles(site, 'csv');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `permissions-matrix-${site}.csv`;
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
