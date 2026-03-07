'use client';
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface HoursDisplayProps {
  hours: number;
  color?: string;
  bold?: boolean;
}

const HoursDisplay: React.FC<HoursDisplayProps> = ({ hours, color, bold }) => (
  <Text strong={bold} style={color ? { color } : undefined}>
    {hours.toFixed(1)} h
  </Text>
);

export default HoursDisplay;
