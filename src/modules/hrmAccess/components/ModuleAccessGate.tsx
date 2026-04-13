'use client';

import React, { useEffect } from 'react';
import { Result, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import CommonAppBar from '@/components/CommonAppBar';
import { useCan } from '../hooks/useCan';
import { useHrmRbacStore } from '../stores/hrmRbacStore';
import { ModulePermissionProvider } from '../context/ModulePermissionContext';

interface ModuleAccessGateProps {
  moduleCode: string;
  appTitle: string;
  children: React.ReactNode;
}

/**
 * Top-level access gate for HRM modules.
 * Blocks the entire module render if user has no VIEW permission.
 *
 * Usage:
 *   <ModuleAccessGate moduleCode="HRM_POLICY" appTitle="HR Policies">
 *     <YourLandingContent />
 *   </ModuleAccessGate>
 */
const ModuleAccessGate: React.FC<ModuleAccessGateProps> = ({
  moduleCode,
  appTitle,
  children,
}) => {
  const isRbacReady = useHrmRbacStore(s => s.isReady);
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const perms = useCan(moduleCode);

  // Eagerly load object-level (section) permissions for this module so any
  // <Can object="..."> wrapper inside the subtree resolves to precise perms.
  // The store de-duplicates calls — repeat mounts are no-ops.
  useEffect(() => {
    if (isRbacReady && perms.canView && moduleCode) {
      loadSectionPermissions(moduleCode);
    }
  }, [isRbacReady, perms.canView, moduleCode, loadSectionPermissions]);

  // Wait for RBAC initialization
  if (!isRbacReady) {
    return (
      <div className="hrm-module-root" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CommonAppBar appTitle={appTitle} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // No view permission → show 403
  if (!perms.canView) {
    return (
      <div className="hrm-module-root" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CommonAppBar appTitle={appTitle} />
        <Result
          icon={<LockOutlined style={{ color: '#bfbfbf' }} />}
          status="403"
          title="Access Denied"
          subTitle={`You don't have permission to view the ${appTitle} module. Please contact your administrator.`}
          style={{ marginTop: 60 }}
        />
      </div>
    );
  }

  // Publish the module's permissions to any descendant via context so they
  // can use <Can I="..."> / useCan() without passing props or knowing the code.
  return (
    <ModulePermissionProvider moduleCode={moduleCode}>
      {children}
    </ModulePermissionProvider>
  );
};

export default ModuleAccessGate;
