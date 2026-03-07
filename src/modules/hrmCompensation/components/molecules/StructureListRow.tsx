'use client';

import React from 'react';
import { Tag, Typography } from 'antd';
import type { SalaryStructure } from '../../types/domain.types';

interface StructureListRowProps {
  structure: SalaryStructure;
  selected: boolean;
  onClick: () => void;
}

const StructureListRow: React.FC<StructureListRowProps> = ({
  structure,
  selected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        background: selected ? '#e6f4ff' : 'transparent',
        borderRadius: 6,
        borderLeft: selected ? '3px solid #1890ff' : '3px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {structure.structureCode}
        </Typography.Text>
        <Tag color="cyan" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>
          {structure.applicableGrade}
        </Tag>
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }} ellipsis>
        {structure.structureName}
      </Typography.Text>
      <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
        {structure.components.length} components
      </div>
    </div>
  );
};

export default StructureListRow;
