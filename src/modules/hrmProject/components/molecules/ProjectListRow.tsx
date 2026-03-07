'use client';
import React from 'react';
import { Typography, Space } from 'antd';
import type { ProjectListRowProps } from '../../types/ui.types';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import styles from '../../styles/ProjectList.module.css';

const { Text } = Typography;

const ProjectListRow: React.FC<ProjectListRowProps> = ({ project, isSelected, onClick }) => {
  const util = Math.min(project.utilizationPercentage ?? 0, 100);

  return (
    <div
      className={`${styles.projectRow} ${isSelected ? styles.projectRowSelected : ''}`}
      onClick={() => onClick(project)}
    >
      <div className={styles.projectRowMeta}>
        <Text strong style={{ fontSize: 13 }}>{project.projectCode}</Text>
        <Text style={{ fontSize: 13 }}>{project.projectName}</Text>
        <ProjectStatusBadge status={project.status} />
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
          {project.projectType}
        </Text>
      </div>
      <Space size={16} style={{ fontSize: 12 }}>
        <Text type="secondary">PM: {project.projectManagerName}</Text>
        <Text type="secondary">Est: {project.estimateHours}h</Text>
        <Text type="secondary">Alloc: {project.totalAllocatedHours}h</Text>
        <Text type="secondary">Act: {project.totalActualHours}h</Text>
        <Text type="secondary">Util: {util}%</Text>
      </Space>
      <div className={styles.utilBar}>
        <div className={styles.utilFill} style={{ width: `${util}%` }} />
      </div>
    </div>
  );
};

export default ProjectListRow;
