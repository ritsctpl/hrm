'use client';

import React from 'react';
import { Typography } from 'antd';

interface AssetRequestTemplateProps {
  listPanel: React.ReactNode;
  detailPanel: React.ReactNode;
  listWidth?: string;
}

const AssetRequestTemplate: React.FC<AssetRequestTemplateProps> = ({
  listPanel,
  detailPanel,
  listWidth = '420px',
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${listWidth} 1fr`,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          overflowY: 'auto',
          borderRight: '1px solid #f0f0f0',
          background: '#fff',
          padding: '12px 8px',
        }}
      >
        {listPanel}
      </div>
      <div
        style={{
          overflowY: 'auto',
          background: '#fafafa',
          padding: 16,
        }}
      >
        {detailPanel ?? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography.Text type="secondary">Select a request to view details</Typography.Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetRequestTemplate;
