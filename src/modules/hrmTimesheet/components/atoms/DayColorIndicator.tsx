'use client';
import { DAY_COLOR_STYLES } from '../../utils/timesheetConstants';
import type { DayColorIndicatorProps } from '../../types/ui.types';

const SIZE_MAP = { sm: 8, md: 12, lg: 16 };

export default function DayColorIndicator({ colorCode, size = 'md' }: DayColorIndicatorProps) {
  const style = DAY_COLOR_STYLES[colorCode] ?? DAY_COLOR_STYLES.GREY;
  const px = SIZE_MAP[size];
  return (
    <span
      style={{
        display: 'inline-block',
        width: px,
        height: px,
        borderRadius: '50%',
        backgroundColor: style.text,
        flexShrink: 0,
      }}
    />
  );
}
