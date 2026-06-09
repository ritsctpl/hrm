'use client';
import { Tabs, Skeleton } from 'antd';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectTasksTab from './ProjectTasksTab';
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
    { key: 'tasks', label: 'Tasks', children: <ProjectTasksTab /> },
    { key: 'allocations', label: 'Team', children: <ProjectAllocationsTab /> },
    { key: 'milestones', label: 'Milestones', children: <ProjectMilestonesTab /> },
    { key: 'attachments', label: 'Files', children: <ProjectAttachmentsTab /> },
    { key: 'audit', label: 'History', children: <ProjectAuditTab /> },
  ];

  return (
    <div className={styles.detailPanel}>
      <Tabs
        activeKey={activeDetailTab}
        onChange={(k) => setActiveDetailTab(k as typeof activeDetailTab)}
        items={items}
        size="small"
        tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
      />
    </div>
  );
}
