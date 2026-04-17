'use client';

import React, { useEffect, useMemo } from 'react';
import { Tabs } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import CommonAppBar from '@/components/CommonAppBar';
import ModuleRegistryTemplate from './components/templates/ModuleRegistryTemplate';
import RoleManagementTemplate from './components/templates/RoleManagementTemplate';
import PermissionMatrixTemplate from './components/templates/PermissionMatrixTemplate';
import UserRoleAssignmentTemplate from './components/templates/UserRoleAssignmentTemplate';
import ImportExportTemplate from './components/templates/ImportExportTemplate';
// import RbacReportsTemplate from './components/templates/RbacReportsTemplate';
// import RbacAuditLogTemplate from './components/templates/RbacAuditLogTemplate';
import { useHrmAccessStore } from './stores/hrmAccessStore';
import { HrmAccessService } from './services/hrmAccessService';
import styles from './styles/HrmAccess.module.css';

const HrmAccessLanding: React.FC = () => {
  const organizationId = getOrganizationId();
  const cookies = parseCookies();

  const userId = cookies.userId ?? '';
  const userName = cookies.userName ?? '';
  const user = useMemo(
    () => (userId ? { id: userId, name: userName } : null),
    [userId, userName]
  );

  const { activeMainTab, setActiveMainTab, setRoles, setRoleLoading, setAllModules, setAllPermissions } =
    useHrmAccessStore();

  useEffect(() => {
    if (!organizationId) return;

    setRoleLoading(true);
    Promise.all([
      HrmAccessService.fetchAllRoles(organizationId),
      HrmAccessService.fetchAllModules(organizationId),
      HrmAccessService.fetchAllPermissions(organizationId),
    ])
      .then(([roles, modules, permissions]) => {
        setRoles(roles);
        setAllModules(modules);
        setAllPermissions(permissions);
      })
      .catch(() => setRoleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const tabItems = [
    {
      key: 'modules',
      label: 'Modules',
      children: <ModuleRegistryTemplate organizationId={organizationId} user={user} />,
    },
    {
      key: 'roleManagement',
      label: 'Roles',
      children: <RoleManagementTemplate organizationId={organizationId} user={user} />,
    },
    {
      key: 'permissionMatrix',
      label: 'Permissions Matrix',
      children: <PermissionMatrixTemplate organizationId={organizationId} isActive={activeMainTab === 'permissionMatrix'} />,
    },
    {
      key: 'userRoleAssignment',
      label: 'User Assignments',
      children: <UserRoleAssignmentTemplate organizationId={organizationId} user={user} />,
    },
    {
      key: 'importExport',
      label: 'Import / Export',
      children: <ImportExportTemplate organizationId={organizationId} user={user} />,
    },
    // {
    //   key: 'reports',
    //   label: 'Reports',
    //   children: <RbacReportsTemplate organizationId={organizationId} />,
    // },
    // {
    //   key: 'audit',
    //   label: 'Audit Log',
    //   children: <RbacAuditLogTemplate organizationId={organizationId} />,
    // },
  ];

  return (
    <div className={`hrm-module-root ${styles.rbacLanding}`}>
      <CommonAppBar appTitle="Access Control (RBAC)" />
      <div className={styles.tabsWrapper}>
        <Tabs
          activeKey={activeMainTab}
          onChange={(key) => setActiveMainTab(key as typeof activeMainTab)}
          items={tabItems}
          className={styles.mainTabs}
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
          destroyOnHidden={false}
        />
      </div>
    </div>
  );
};

export default HrmAccessLanding;
