'use client';
import React from 'react';
import ProjectKpiCard from '../molecules/ProjectKpiCard';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import styles from '../../styles/ProjectList.module.css';

// Counts are derived from the loaded projects so the tiles always reflect the
// current list (and update immediately after create / status change).
const ProjectDashboardHeader: React.FC = () => {
  const { projects, setFilterStatus } = useHrmProjectStore();
  const count = (s: string) => projects.filter((p) => p.status === s).length;

  return (
    <div className={styles.kpiRow}>
      <ProjectKpiCard label="Total" value={projects.length} colorVariant="default" onClick={() => setFilterStatus('')} />
      <ProjectKpiCard label="Initiated" value={count('INITIATED')} colorVariant="info" onClick={() => setFilterStatus('INITIATED')} />
      <ProjectKpiCard label="In Progress" value={count('IN_PROGRESS')} colorVariant="success" onClick={() => setFilterStatus('IN_PROGRESS')} />
      <ProjectKpiCard label="On Hold" value={count('ON_HOLD')} colorVariant="warning" onClick={() => setFilterStatus('ON_HOLD')} />
      <ProjectKpiCard label="Completed" value={count('COMPLETED')} colorVariant="default" onClick={() => setFilterStatus('COMPLETED')} />
    </div>
  );
};

export default ProjectDashboardHeader;
