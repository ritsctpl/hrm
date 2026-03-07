'use client';
import React from 'react';
import ProjectKpiCard from '../molecules/ProjectKpiCard';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import styles from '../../styles/ProjectList.module.css';

interface ProjectDashboardHeaderProps {
  kpis: { total: number; active: number; draft: number; onHold: number; completed: number };
}

const ProjectDashboardHeader: React.FC<ProjectDashboardHeaderProps> = ({ kpis }) => {
  const { setFilterStatus } = useHrmProjectStore();

  return (
    <div className={styles.kpiRow}>
      <ProjectKpiCard label="Total" value={kpis.total} colorVariant="default" onClick={() => setFilterStatus('')} />
      <ProjectKpiCard label="Active" value={kpis.active} colorVariant="success" onClick={() => setFilterStatus('ACTIVE')} />
      <ProjectKpiCard label="Draft" value={kpis.draft} colorVariant="info" onClick={() => setFilterStatus('DRAFT')} />
      <ProjectKpiCard label="On Hold" value={kpis.onHold} colorVariant="warning" onClick={() => setFilterStatus('ON_HOLD')} />
      <ProjectKpiCard label="Completed" value={kpis.completed} colorVariant="default" onClick={() => setFilterStatus('COMPLETED')} />
    </div>
  );
};

export default ProjectDashboardHeader;
