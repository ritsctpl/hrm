'use client';
import React, { useEffect, useMemo } from 'react';
import { Tabs, Button, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmProjectStore } from './stores/hrmProjectStore';
import { useProjectData } from './hooks/useProjectData';
import ProjectDashboardHeader from './components/organisms/ProjectDashboardHeader';
import ProjectMasterList from './components/organisms/ProjectMasterList';
import ProjectDetailPanel from './components/organisms/ProjectDetailPanel';
import AllocationApprovalInbox from './components/organisms/AllocationApprovalInbox';
import ResourceCalendarView from './components/organisms/ResourceCalendarView';
import ProjectReportPanel from './components/organisms/ProjectReportPanel';
import ProjectForm from './components/organisms/ProjectForm';
import AllocationForm from './components/organisms/AllocationForm';
import styles from './styles/HrmProject.module.css';

export default function HrmProjectLanding() {
  const {
    activeTab,
    setActiveTab,
    isProjectFormOpen,
    closeProjectForm,
    isAllocationFormOpen,
    closeAllocationForm,
    openProjectForm,
    selectedProject,
    projects,
    projectKpis,
    loadingProjects,
    filterBU,
    filterType,
    filterStatus,
    searchQuery,
    setSelectedProject,
  } = useHrmProjectStore();
  const { loadProjects, loadProjectDetail } = useProjectData();

  useEffect(() => {
    loadProjects();
  }, [filterBU, filterType, filterStatus]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (searchQuery && !p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !p.projectCode.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterType && p.projectType !== filterType) return false;
      return true;
    });
  }, [projects, searchQuery, filterStatus, filterType]);

  const handleSelectProject = (project: typeof projects[number]) => {
    setSelectedProject(project);
    loadProjectDetail(project.handle);
  };

  const tabItems = [
    {
      key: 'projects',
      label: 'Projects',
      children: (
        <div className={styles.masterDetailLayout}>
          <div className={styles.masterPane}>
            <ProjectDashboardHeader kpis={projectKpis} />
            <ProjectMasterList
              projects={filteredProjects}
              loading={loadingProjects}
              selectedHandle={selectedProject?.handle}
              onSelect={handleSelectProject}
            />
          </div>
          <div className={styles.detailPane}>
            <ProjectDetailPanel />
          </div>
        </div>
      ),
    },
    { key: 'approvals', label: 'Approvals', children: <AllocationApprovalInbox /> },
    { key: 'calendar', label: 'Resource Calendar', children: <ResourceCalendarView /> },
    { key: 'reports', label: 'Reports', children: <ProjectReportPanel /> },
  ];

  return (
    <div className={styles.hrmProjectLanding}>
      <CommonAppBar appTitle="Projects & Resource Allocation" />
      <div className={styles.content}>
        <Tabs
          className={styles.mainTabs}
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as typeof activeTab)}
          items={tabItems}
        />
      </div>

      <Modal
        title={selectedProject ? `Edit — ${selectedProject.projectCode}` : 'New Project'}
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
