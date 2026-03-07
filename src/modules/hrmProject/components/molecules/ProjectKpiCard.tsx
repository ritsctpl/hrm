'use client';
import React from 'react';
import { Card, Statistic } from 'antd';
import type { ProjectKpiCardProps } from '../../types/ui.types';
import styles from '../../styles/ProjectList.module.css';

const COLOR_MAP: Record<string, string> = {
  default: '#000000d9',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  info: '#1890ff',
};

const ProjectKpiCard: React.FC<ProjectKpiCardProps> = ({ label, value, colorVariant, onClick }) => (
  <Card
    className={styles.kpiCard}
    onClick={onClick}
    bodyStyle={{ padding: '12px 16px' }}
  >
    <Statistic
      title={label}
      value={value}
      valueStyle={{ color: COLOR_MAP[colorVariant], fontSize: 24 }}
    />
  </Card>
);

export default ProjectKpiCard;
