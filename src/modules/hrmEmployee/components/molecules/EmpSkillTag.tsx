/**
 * EmpSkillTag - Tag display for a skill with proficiency level color
 */

'use client';

import React from 'react';
import { Tag } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { PROFICIENCY_COLORS, PROFICIENCY_LABELS } from '../../utils/constants';
import type { EmpSkillTagProps } from '../../types/ui.types';

const EmpSkillTag: React.FC<EmpSkillTagProps> = ({ skill, onRemove, removable = false }) => {
  const color = PROFICIENCY_COLORS[skill.proficiency] || 'default';
  const profLabel = PROFICIENCY_LABELS[skill.proficiency] || skill.proficiency;

  return (
    <Tag
      color={color}
      closable={removable}
      closeIcon={removable ? <CloseOutlined /> : undefined}
      onClose={() => onRemove?.(skill.skillId)}
      style={{ borderRadius: 6, padding: '2px 10px', fontSize: 12 }}
    >
      {skill.skillName}
      <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 10 }}>
        ({profLabel})
      </span>
    </Tag>
  );
};

export default EmpSkillTag;
