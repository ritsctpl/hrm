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

  const count = (n: number) => (n > 0 ? ` (${n})` : '');
  const taskCount = selectedProject.tasks?.length ?? 0;
  const msCount = selectedProject.milestones?.length ?? 0;
  const fileCount = selectedProject.attachments?.length ?? 0;

  const items = [
    { key: 'overview', label: 'Overview', children: <ProjectOverviewTab project={selectedProject} /> },
    { key: 'tasks', label: `Tasks${count(taskCount)}`, children: <ProjectTasksTab /> },
    { key: 'allocations', label: 'Team', children: <ProjectAllocationsTab /> },
    { key: 'milestones', label: `Milestones${count(msCount)}`, children: <ProjectMilestonesTab /> },
    { key: 'attachments', label: `Files${count(fileCount)}`, children: <ProjectAttachmentsTab /> },
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
