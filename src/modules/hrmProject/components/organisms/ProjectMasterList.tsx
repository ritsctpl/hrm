'use client';
import React from 'react';
import { Card, Spin, Empty } from 'antd';
import type { Project } from '../../types/domain.types';
import ProjectListRow from '../molecules/ProjectListRow';
import ProjectSearchBar from '../molecules/ProjectSearchBar';
import styles from '../../styles/ProjectList.module.css';

interface ProjectMasterListProps {
  projects: Project[];
  loading: boolean;
  selectedHandle?: string;
  onSelect: (project: Project) => void;
}

const ProjectMasterList: React.FC<ProjectMasterListProps> = ({ projects, loading, selectedHandle, onSelect }) => (
  <Card bodyStyle={{ padding: 0 }} className={styles.projectList}>
    <div style={{ padding: '12px 12px 0' }}>
      <ProjectSearchBar />
    </div>
    {loading ? (
      <div style={{ padding: 32, textAlign: 'center' }}><Spin /></div>
    ) : projects.length === 0 ? (
      <Empty description="No projects found" style={{ padding: 32 }} />
    ) : (
      <div style={{ maxHeight: 520, overflowY: 'auto' }}>
        {projects.map((p) => (
          <ProjectListRow
            key={p.handle}
            project={p}
            isSelected={p.handle === selectedHandle}
            onClick={onSelect}
          />
        ))}
      </div>
    )}
  </Card>
);

export default ProjectMasterList;
