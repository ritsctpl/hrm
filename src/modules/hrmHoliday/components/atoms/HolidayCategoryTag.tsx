'use client';

import { Tag } from 'antd';
import type { HolidayCategoryTagProps } from '../../types/ui.types';

export default function HolidayCategoryTag({
  categoryCode,
  displayName,
  colorHex,
  isFaded = false,
}: HolidayCategoryTagProps) {
  const opacity = isFaded ? 0.5 : 1;
  const label = displayName || categoryCode || 'N/A';
  const bgColor = colorHex || '#999';
  
  return (
    <Tag
      style={{
        backgroundColor: bgColor,
        color: '#fff',
        border: 'none',
        opacity,
        fontWeight: 500,
        fontSize: 11,
      }}
    >
      {label}
    </Tag>
  );
}
