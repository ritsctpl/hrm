'use client';
import { Tabs, Modal } from 'antd';
import ProjectDashboardHeader from '../organisms/ProjectDashboardHeader';
import ProjectMasterList from '../organisms/ProjectMasterList';
import ProjectDetailPanel from '../organisms/ProjectDetailPanel';
import AllocationApprovalInbox from '../organisms/AllocationApprovalInbox';
import ResourceCalendarView from '../organisms/ResourceCalendarView';
import ProjectReportPanel from '../organisms/ProjectReportPanel';
import ProjectForm from '../organisms/ProjectForm';
import AllocationForm from '../organisms/AllocationForm';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import styles from '../../styles/HrmProject.module.css';

export default function ProjectLandingTemplate() {
  const {
    activeTab,
    setActiveTab,
    isProjectFormOpen,
    closeProjectForm,
    isAllocationFormOpen,
    closeAllocationForm,
    selectedProject,
    projectKpis,
    projects,
    loadingProjects,
    setSelectedProject,
  } = useHrmProjectStore();

  const tabItems = [
    {
      key: 'projects',
      label: 'Projects',
      children: (
        <div className={styles.masterDetailLayout}>
          <div className={styles.masterPane}>
            <ProjectDashboardHeader kpis={projectKpis} />
            <ProjectMasterList
              projects={projects}
              loading={loadingProjects}
              selectedHandle={selectedProject?.handle}
              onSelect={setSelectedProject}
            />
          </div>
          <div className={styles.detailPane}>
            <ProjectDetailPanel />
          </div>
        </div>
      ),
    },
    {
      key: 'resources',
      label: 'Resources',
      children: (
        <Tabs
          size="small"
          items={[
            { key: 'approvals', label: 'Approvals', children: <AllocationApprovalInbox /> },
            { key: 'calendar', label: 'Calendar', children: <ResourceCalendarView /> },
          ]}
        />
      ),
    },
    {
      key: 'reportsClients',
      label: 'Reports & Clients',
      children: <ProjectReportPanel />,
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as typeof activeTab)}
        items={tabItems}
        size="large"
      />

      <Modal
        title={isProjectFormOpen ? 'Project' : ''}
        open={isProjectFormOpen}
        onCancel={closeProjectForm}
        footer={null}
        width={720}
        destroyOnClose
      >
        <ProjectForm />
      </Modal>

      <Modal
        title="Add Resource Allocation"
        open={isAllocationFormOpen}
        onCancel={closeAllocationForm}
        footer={null}
        width={640}
        destroyOnClose
      >
        {selectedProject && <AllocationForm projectHandle={selectedProject.handle} />}
      </Modal>
    </div>
  );
}
