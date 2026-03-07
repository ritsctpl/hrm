'use client';
import { Tabs, Skeleton } from 'antd';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectAllocationsTab from './ProjectAllocationsTab';
import ProjectMilestonesTab from './ProjectMilestonesTab';
import ProjectAttachmentsTab from './ProjectAttachmentsTab';
import ProjectAuditTab from './ProjectAuditTab';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import styles from '../../styles/ProjectDetail.module.css';

export default function ProjectDetailPanel() {
  const { selectedProject, activeDetailTab, setActiveDetailTab, loadingProjects } = useHrmProjectStore();

  if (!selectedProject) {
    return (
      <div className={styles.emptyPanel}>
        <div className={styles.emptyPanelText}>Select a project to view details</div>
      </div>
    );
  }

  if (loadingProjects) {
    return <Skeleton active />;
  }

  const items = [
    { key: 'overview', label: 'Overview', children: <ProjectOverviewTab project={selectedProject} /> },
    { key: 'allocations', label: 'Allocations', children: <ProjectAllocationsTab /> },
    { key: 'milestones', label: 'Milestones', children: <ProjectMilestonesTab /> },
    { key: 'attachments', label: 'Attachments', children: <ProjectAttachmentsTab /> },
    { key: 'audit', label: 'Audit', children: <ProjectAuditTab /> },
  ];

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailTitle}>
        <span className={styles.projectCode}>{selectedProject.projectCode}</span>
        <span className={styles.projectName}> — {selectedProject.projectName}</span>
      </div>
      <Tabs
        activeKey={activeDetailTab}
        onChange={(k) => setActiveDetailTab(k as typeof activeDetailTab)}
        items={items}
        size="small"
      />
    </div>
  );
}
