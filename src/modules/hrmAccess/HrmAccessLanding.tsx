'use client';

import React, { useEffect } from 'react';
import { Tabs } from 'antd';
import { parseCookies } from 'nookies';
import RoleManagementTemplate from './components/templates/RoleManagementTemplate';
import PermissionMatrixTemplate from './components/templates/PermissionMatrixTemplate';
import UserRoleAssignmentTemplate from './components/templates/UserRoleAssignmentTemplate';
import { useHrmAccessStore } from './stores/hrmAccessStore';
import { HrmAccessService } from './services/hrmAccessService';
import styles from './styles/HrmAccess.module.css';

const HrmAccessLanding: React.FC = () => {
  const cookies = parseCookies();
  const site = cookies.site ?? '';

  // Minimal user object from cookies
  const userId = cookies.userId ?? '';
  const userName = cookies.userName ?? '';
  const user = userId ? { id: userId, name: userName } : null;

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
  }, [site, setRoles, setRoleLoading, setAllModules, setAllPermissions]);

  const tabItems = [
    {
      key: 'roleManagement',
      label: 'Role Management',
      children: <RoleManagementTemplate site={site} user={user} />,
    },
    {
      key: 'permissionMatrix',
      label: 'Permission Matrix',
      children: <PermissionMatrixTemplate site={site} />,
    },
    {
      key: 'userRoleAssignment',
      label: 'User-Role Assignment',
      children: <UserRoleAssignmentTemplate site={site} user={user} />,
    },
  ];

  return (
    <div className={styles.rbacLanding}>
      <div className={styles.tabsWrapper}>
        <Tabs
          activeKey={activeMainTab}
          onChange={(key) => setActiveMainTab(key as typeof activeMainTab)}
          items={tabItems}
          className={styles.mainTabs}
          destroyOnHidden={false}
        />
      </div>
    </div>
  );
};

export default HrmAccessLanding;
