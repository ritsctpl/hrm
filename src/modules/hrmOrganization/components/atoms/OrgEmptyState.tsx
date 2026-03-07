'use client';

import React from 'react';
import { Empty, Typography } from 'antd';

interface OrgEmptyStateProps {
  description?: string;
  subDescription?: string;
}

const OrgEmptyState: React.FC<OrgEmptyStateProps> = ({
  description = 'No data available',
  subDescription,
}) => {
  return (
    <Empty
      description={
        <span>
          <Typography.Text>{description}</Typography.Text>
          {subDescription && (
            <>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {subDescription}
              </Typography.Text>
            </>
          )}
        </span>
      }
    />
  );
};

export default OrgEmptyState;
