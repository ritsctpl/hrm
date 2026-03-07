/**
 * EmpAvatar - Atom component for employee avatar with initials fallback
 */

'use client';

import React from 'react';
import { Avatar } from 'antd';
import { getInitials } from '../../utils/transformations';
import type { EmpAvatarProps } from '../../types/ui.types';

/** Deterministic color from name string */
function avatarColor(name: string): string {
  const colors = [
    '#1a237e', '#0277bd', '#00695c', '#2e7d32',
    '#558b2f', '#f57f17', '#e65100', '#ad1457',
    '#6a1b9a', '#4527a0', '#283593', '#00838f',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const EmpAvatar: React.FC<EmpAvatarProps> = ({ name, photoUrl, size = 40 }) => {
  if (photoUrl) {
    return (
      <Avatar src={photoUrl} size={size} alt={name} />
    );
  }

  return (
    <Avatar
      size={size}
      style={{ backgroundColor: avatarColor(name), fontWeight: 600, fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </Avatar>
  );
};

export default EmpAvatar;
