'use client';

import React, { useEffect, useMemo } from 'react';
import { Tabs } from 'antd';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import ModuleRegistryTemplate from './components/templates/ModuleRegistryTemplate';
import RoleManagementTemplate from './components/templates/RoleManagementTemplate';
import PermissionMatrixTemplate from './components/templates/PermissionMatrixTemplate';
import UserRoleAssignmentTemplate from './components/templates/UserRoleAssignmentTemplate';
import ImportExportTemplate from './components/templates/ImportExportTemplate';
import RbacReportsTemplate from './components/templates/RbacReportsTemplate';
import RbacAuditLogTemplate from './components/templates/RbacAuditLogTemplate';
import { useHrmAccessStore } from './stores/hrmAccessStore';
import { HrmAccessService } from './services/hrmAccessService';
import styles from './styles/HrmAccess.module.css';

const HrmAccessLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? '';

  const userId = cookies.userId ?? '';
  const userName = cookies.userName ?? '';
  const user = useMemo(
    () => (userId ? { id: userId, name: userName } : null),
    [userId, userName]
  );

  const { activeMainTab, setActiveMainTab, setRoles, setRoleLoading, setAllModules, setAllPermissions } =
    useHrmAccessStore();

  useEffect(() => {
    if (!site) return;

    setRoleLoading(true);
    Promise.all([
      HrmAccessService.fetchAllRoles(site),
      HrmAccessService.fetchAllModules(site),
      HrmAccessService.fetchAllPermissions(site),
    ])
      .then(([roles, modules, permissions]) => {
        setRoles(roles);
        setAllModules(modules);
        setAllPermissions(permissions);
      })
      .catch(() => setRoleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const tabItems = [
    {
      key: 'modules',
      label: 'Modules',
      children: <ModuleRegistryTemplate site={site} user={user} />,
    },
    {
      key: 'roleManagement',
      label: 'Roles',
      children: <RoleManagementTemplate site={site} user={user} />,
    },
    {
      key: 'permissionMatrix',
      label: 'Permissions Matrix',
      children: <PermissionMatrixTemplate site={site} isActive={activeMainTab === 'permissionMatrix'} />,
    },
    {
      key: 'userRoleAssignment',
      label: 'User Assignments',
      children: <UserRoleAssignmentTemplate site={site} user={user} />,
    },
    {
      key: 'importExport',
      label: 'Import / Export',
      children: <ImportExportTemplate site={site} user={user} />,
    },
    {
      key: 'reports',
      label: 'Reports',
      children: <RbacReportsTemplate site={site} />,
    },
    {
      key: 'audit',
      label: 'Audit Log',
      children: <RbacAuditLogTemplate site={site} />,
    },
  ];

  return (
    <div className={styles.rbacLanding}>
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
