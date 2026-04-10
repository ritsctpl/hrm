'use client';

import React from 'react';
import { Result, Spin } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import CommonAppBar from '@/components/CommonAppBar';
import { useModulePermissions } from '../hooks/useModulePermissions';
import { useHrmRbacStore } from '../stores/hrmRbacStore';

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
  const perms = useModulePermissions(moduleCode);

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

  return <>{children}</>;
};

export default ModuleAccessGate;
