'use client';

import React from 'react';
import { Tag, Switch, Typography } from 'antd';
import type { PayComponent } from '../../types/domain.types';

interface PayComponentListRowProps {
  component: PayComponent;
  selected: boolean;
  onClick: () => void;
}

const PayComponentListRow: React.FC<PayComponentListRowProps> = ({
  component,
  selected,
  onClick,
}) => {
  const typeColor = component.componentType === 'EARNING' ? 'green' : 'red';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        background: selected ? '#e6f4ff' : 'transparent',
        borderRadius: 6,
        borderLeft: selected ? '3px solid #1890ff' : '3px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {component.componentCode}
          </Typography.Text>
          <Tag color={typeColor} style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
            {component.componentType}
          </Tag>
        </div>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 12, display: 'block' }}
          ellipsis
        >
          {component.componentName}
        </Typography.Text>
      </div>
      <Switch
        checked={component.active === 1}
        size="small"
        onClick={(e) => e}
        style={{ flexShrink: 0 }}
      />
    </div>
  );
};

export default PayComponentListRow;
