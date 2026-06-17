'use client';

import React from 'react';
import type { GradeLevelBadgeProps } from '../../types/ui.types';

/** Small numeric rank chip used in the grade list and form header. */
const GradeLevelBadge: React.FC<GradeLevelBadgeProps> = ({ level }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 24,
      height: 24,
      padding: '0 6px',
      borderRadius: 6,
      background: '#1a1a2e',
      color: '#fff',
      fontSize: 12,
      fontWeight: 600,
      lineHeight: '24px',
    }}
  >
    L{level}
  </span>
);

export default GradeLevelBadge;
