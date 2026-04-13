'use client';

import React, { useEffect } from 'react';
import { Typography } from 'antd';
import { useHrmRbacStore } from '@/modules/hrmAccess/stores/hrmRbacStore';

const { Text } = Typography;

/**
 * HrmOrganizationScreen - Detail view (reserved for future use)
 * This component is a placeholder for a dedicated detail/screen view
 * that may be needed for deep drill-down into organization entities.
 * 
 * RBAC: Loads permissions on mount for the Organization module
 */
const HrmOrganizationScreen: React.FC = () => {
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const isReady = useHrmRbacStore(s => s.isReady);

  // Load Organization module permissions on mount
  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_ORGANIZATION');
    }
  }, [isReady, loadSectionPermissions]);

  return (
    <div style={{ padding: 24 }}>
      <Text type="secondary">
        Organization detail view - reserved for future implementation.
      </Text>
    </div>
  );
};

export default HrmOrganizationScreen;
