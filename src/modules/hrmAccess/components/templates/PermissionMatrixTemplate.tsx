'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  // Use individual selectors so this component only re-renders for slices
  // it actually consumes — the matrix is heavy and was previously
  // re-rendering on every store mutation (role list, perm toggles, etc).
  const matrixIsLoading = useHrmAccessStore((s) => s.permissionMatrix.isLoading);
  const moduleFilter = useHrmAccessStore((s) => s.permissionMatrix.moduleFilter);
  const roleFilter = useHrmAccessStore((s) => s.permissionMatrix.roleFilter);
  const allModules = useHrmAccessStore((s) => s.permission.allModules);
  const roleList = useHrmAccessStore((s) => s.role.list);
  const setMatrixLoading = useHrmAccessStore((s) => s.setMatrixLoading);
  const setMatrixModuleFilter = useHrmAccessStore((s) => s.setMatrixModuleFilter);
  const setMatrixRoleFilter = useHrmAccessStore((s) => s.setMatrixRoleFilter);

  const [rawMatrixData, setRawMatrixData] = useState<PermissionsMatrixResponse[]>([]);
  // Track which org the cached matrix belongs to. Switching tabs back
  // should not refetch; switching organizations should.
  const loadedForOrgRef = useRef<string | null>(null);

  const fetchMatrix = useCallback(
    (orgId: string) => {
      setMatrixLoading(true);
      HrmAccessService.fetchPermissionsMatrix(orgId, null, null)
        .then((data) => {
          setRawMatrixData(data);
          loadedForOrgRef.current = orgId;
          setMatrixLoading(false);
        })
        .catch(() => {
          notification.error({ message: 'Failed to load permission matrix.' });
          setMatrixLoading(false);
        });
    },
    [setMatrixLoading],
  );

  // Load on first activation per organization. Tab toggles within the
  // same org reuse the cached data — use the Refresh button to repull.
  useEffect(() => {
    if (!organizationId || !isActive) return;
    if (loadedForOrgRef.current === organizationId) return;
    fetchMatrix(organizationId);
  }, [organizationId, isActive, fetchMatrix]);

  const handleRefresh = useCallback(() => {
    if (!organizationId) return;
    fetchMatrix(organizationId);
  }, [organizationId, fetchMatrix]);

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
        modules={allModules}
        roles={roleList}
        moduleFilter={moduleFilter}
        roleFilter={roleFilter}
        onModuleFilterChange={setMatrixModuleFilter}
        onRoleFilterChange={setMatrixRoleFilter}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isLoading={matrixIsLoading}
      />

      <PermissionMatrixGrid
        matrixData={rawMatrixData}
        roles={roleList}
        isLoading={matrixIsLoading}
        moduleFilter={moduleFilter}
        roleFilter={roleFilter}
      />
    </div>
  );
};

export default PermissionMatrixTemplate;
