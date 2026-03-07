'use client';

import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

/**
 * HrmOrganizationScreen - Detail view (reserved for future use)
 * This component is a placeholder for a dedicated detail/screen view
 * that may be needed for deep drill-down into organization entities.
 */
const HrmOrganizationScreen: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Text type="secondary">
        Organization detail view - reserved for future implementation.
      </Text>
    </div>
  );
};

export default HrmOrganizationScreen;
