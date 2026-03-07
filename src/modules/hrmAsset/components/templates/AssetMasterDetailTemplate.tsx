'use client';

import React from 'react';
import { Typography } from 'antd';
import styles from '../../styles/HrmAsset.module.css';

interface AssetMasterDetailTemplateProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftWidth?: string;
}

const AssetMasterDetailTemplate: React.FC<AssetMasterDetailTemplateProps> = ({
  leftPanel,
  rightPanel,
  leftWidth = '380px',
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${leftWidth} 1fr`,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          overflowY: 'auto',
          borderRight: '1px solid #f0f0f0',
          background: '#fff',
        }}
      >
        {leftPanel}
      </div>
      <div
        style={{
          overflowY: 'auto',
          background: '#fafafa',
        }}
      >
        {rightPanel ?? (
          <div className={styles.emptyRight}>
            <Typography.Text type="secondary">Select an asset to view details</Typography.Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetMasterDetailTemplate;
