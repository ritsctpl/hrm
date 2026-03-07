'use client';
import { Typography } from 'antd';
import { DAY_COLOR_STYLES } from '../../utils/timesheetConstants';
import type { HoursDisplayProps } from '../../types/ui.types';

const { Text } = Typography;

export default function HoursDisplay({ hours, colorCode, bold }: HoursDisplayProps) {
  const color = colorCode ? DAY_COLOR_STYLES[colorCode]?.text : undefined;
  return (
    <Text strong={bold} style={color ? { color } : undefined}>
      {hours.toFixed(1)} h
    </Text>
  );
}
