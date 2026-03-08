'use client';
import React, { useEffect, useMemo, useCallback } from 'react';
import { Tabs, Button, Modal, Badge, Drawer, Table, Input, Form, Empty, Popconfirm, message } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmProjectStore } from './stores/hrmProjectStore';
import { useProjectData } from './hooks/useProjectData';
import { HrmProjectService } from './services/hrmProjectService';
import ProjectDashboardHeader from './components/organisms/ProjectDashboardHeader';
import ProjectMasterList from './components/organisms/ProjectMasterList';
import ProjectDetailPanel from './components/organisms/ProjectDetailPanel';
import AllocationApprovalInbox from './components/organisms/AllocationApprovalInbox';
import ResourceCalendarView from './components/organisms/ResourceCalendarView';
import ProjectReportPanel from './components/organisms/ProjectReportPanel';
import ProjectForm from './components/organisms/ProjectForm';
import AllocationForm from './components/organisms/AllocationForm';
import styles from './styles/HrmProject.module.css';

/* ── Client Management Drawer ─────────────────────────────────────── */
interface ClientRecord {
  handle?: string;
  clientCode: string;
  clientName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

function ClientManagementDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [clients, setClients] = React.useState<ClientRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<ClientRecord | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form] = Form.useForm();
  const site = parseCookies().site ?? '';
  const user = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await HrmProjectService.listClients(site);
      setClients(Array.isArray(data) ? data : []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => { if (open) loadClients(); }, [open, loadClients]);

  const openNew = () => { setEditingClient(null); form.resetFields(); setFormOpen(true); };
  const openEdit = (record: ClientRecord) => { setEditingClient(record); form.setFieldsValue(record); setFormOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingClient?.handle) {
        await HrmProjectService.updateClient(editingClient.handle, { ...values, site, modifiedBy: user });
        message.success('Client updated');
      } else {
        await HrmProjectService.createClient({ ...values, site, createdBy: user });
        message.success('Client created');
      }
      setFormOpen(false);
      loadClients();
    } catch { /* validation or api error */ }
  };

  const handleDelete = async (record: ClientRecord) => {
    try {
      await HrmProjectService.deleteClient(site, record.handle ?? '', user);
      message.success('Client deleted');
      loadClients();
    } catch { message.error('Delete failed'); }
  };

  const columns = [
    { title: 'Code', dataIndex: 'clientCode', key: 'clientCode', width: 120 },
    { title: 'Name', dataIndex: 'clientName', key: 'clientName' },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: unknown, record: ClientRecord) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this client?" onConfirm={() => handleDelete(record)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title="Client Management"
      open={open}
      onClose={onClose}
      width={640}
      extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={openNew}>New Client</Button>}
    >
      <Table
        dataSource={clients}
        columns={columns}
        rowKey={(r) => r.handle ?? r.clientCode}
        loading={loading}
        size="small"
        locale={{ emptyText: <Empty description="No clients found" /> }}
      />
      <Modal
        title={editingClient ? 'Edit Client' : 'New Client'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSave}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="clientCode" label="Code" rules={[{ required: true }]}>
            <Input disabled={!!editingClient} />
          </Form.Item>
          <Form.Item name="clientName" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactPerson" label="Contact Person"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
        </Form>
      </Modal>
    </Drawer>
  );
}

/* ── Main Landing ─────────────────────────────────────────────────── */
export default function HrmProjectLanding() {
  const {
    activeTab,
    setActiveTab,
    isProjectFormOpen,
    closeProjectForm,
    isAllocationFormOpen,
    closeAllocationForm,
    isClientDrawerOpen,
    openClientDrawer,
    closeClientDrawer,
    openProjectForm,
    selectedProject,
    projects,
    projectKpis,
    loadingProjects,
    pendingAllocations,
    filterBU,
    filterType,
    filterStatus,
    searchQuery,
    setSelectedProject,
  } = useHrmProjectStore();
  const { loadProjects, loadProjectDetail, loadPendingAllocations } = useProjectData();

  // Load projects on mount and when filters change
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBU, filterType, filterStatus]);

  // Load pending allocations when switching to approvals tab
  useEffect(() => {
    if (activeTab === 'approvals') {
      loadPendingAllocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const pendingCount = pendingAllocations.filter((a) => a.status === 'SUBMITTED').length;

  const tabItems = [
    {
      key: 'projects',
      label: 'Projects',
      children: (
        <div className={styles.masterDetailLayout}>
          <div className={`${styles.masterPane} ${selectedProject ? styles.shrink : ''}`}>
            <div className={styles.masterHeader}>
              <span className={styles.masterTitle}>Projects ({filteredProjects.length})</span>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openProjectForm()}>
                New Project
              </Button>
            </div>
            <ProjectMasterList
              projects={filteredProjects}
              loading={loadingProjects}
              selectedHandle={selectedProject?.handle}
              onSelect={handleSelectProject}
            />
          </div>
          <div className={`${styles.detailPane} ${selectedProject ? styles.show : ''}`}>
            <ProjectDetailPanel />
          </div>
        </div>
      ),
    },
    {
      key: 'approvals',
      label: (
        <Badge count={pendingCount} size="small" offset={[6, 0]}>
          Approvals
        </Badge>
      ),
      children: (
        <div style={{ padding: 16 }}>
          <AllocationApprovalInbox />
        </div>
      ),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      children: (
        <div style={{ padding: 16 }}>
          <ResourceCalendarView />
        </div>
      ),
    },
    {
      key: 'reports',
      label: 'Reports',
      children: (
        <div style={{ padding: 16 }}>
          <ProjectReportPanel />
        </div>
      ),
    },
  ];

  return (
    <div className={styles.hrmProjectLanding}>
      <CommonAppBar appTitle="Projects & Resource Allocation" />
      <div className={styles.content}>
        <ProjectDashboardHeader kpis={projectKpis} />
        <Tabs
          className={styles.mainTabs}
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as typeof activeTab)}
          items={tabItems}
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
          tabBarExtraContent={
            <Button size="small" icon={<TeamOutlined />} onClick={openClientDrawer}>
              Clients
            </Button>
          }
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

      <ClientManagementDrawer open={isClientDrawerOpen} onClose={closeClientDrawer} />
    </div>
  );
}
