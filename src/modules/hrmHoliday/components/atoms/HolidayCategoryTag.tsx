'use client';

import { Tag } from 'antd';
import type { HolidayCategoryTagProps } from '../../types/ui.types';

export default function HolidayCategoryTag({
  displayName,
  colorHex,
  isFaded = false,
}: HolidayCategoryTagProps) {
  const opacity = isFaded ? 0.5 : 1;
  return (
    <Tag
      style={{
        backgroundColor: colorHex,
        color: '#fff',
        border: 'none',
        opacity,
        fontWeight: 500,
        fontSize: 11,
      }}
    >
      {displayName}
    </Tag>
  );
}
