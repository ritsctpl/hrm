'use client';
import React, { useEffect, useMemo, useCallback } from 'react';
import { Tabs, Button, Modal, Drawer, Table, Input, Form, Empty, Popconfirm, message } from 'antd';
import { PlusOutlined, TeamOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { isSameEmployee } from '@/utils/employeeIdentity';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmProjectStore } from './stores/hrmProjectStore';
import { useProjectData } from './hooks/useProjectData';
import { HrmProjectService } from './services/hrmProjectService';
import ProjectTable from './components/organisms/ProjectTable';
import ProjectDetailPanel from './components/organisms/ProjectDetailPanel';
import ProjectStatusBadge from './components/atoms/ProjectStatusBadge';
import ProjectReportPanel from './components/organisms/ProjectReportPanel';
import ProjectForm from './components/organisms/ProjectForm';
import AllocationForm from './components/organisms/AllocationForm';
import Can from '../hrmAccess/components/Can';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import { useProjectPermissions } from './hooks/useProjectPermissions';
import styles from './styles/HrmProject.module.css';

/* ── Client Management Drawer ─────────────────────────────────────── */
interface ClientRecord {
  id?: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

function extractClientErrorMsg(error: any, fallback: string): string {
  return (
    error?.response?.data?.message_details?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.response ||
    error?.message ||
    fallback
  );
}

function ClientManagementDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [clients, setClients] = React.useState<ClientRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<ClientRecord | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form] = Form.useForm();
  const organizationId = getOrganizationId();
  const { employeeCode } = useEmployeeIdentity();
  // Backend actor fields are compared against employeeCode, never the login string.
  const user = employeeCode || parseCookies().rl_user_id || parseCookies().user || 'system';

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await HrmProjectService.listClients(organizationId);
      setClients(Array.isArray(data) ? data : []);
    } catch (error: any) {
      message.error(extractClientErrorMsg(error, 'Failed to load clients'));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { if (open) loadClients(); }, [open, loadClients]);

  const openNew = () => { setEditingClient(null); form.resetFields(); setFormOpen(true); };
  const openEdit = (record: ClientRecord) => { setEditingClient(record); form.setFieldsValue(record); setFormOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingClient?.id) {
        await HrmProjectService.updateClient({
          organizationId,
          id: editingClient.id,
          name: values.name,
          contactPerson: values.contactPerson,
          email: values.email,
          phone: values.phone,
          modifiedBy: user,
        });
        message.success('Client updated');
      } else {
        await HrmProjectService.createClient({
          organizationId,
          code: values.code,
          name: values.name,
          contactPerson: values.contactPerson,
          email: values.email,
          phone: values.phone,
          createdBy: user,
        });
        message.success('Client created');
      }
      setFormOpen(false);
      loadClients();
    } catch (error: any) {
      if (error?.errorFields) return; // antd validation
      message.error(extractClientErrorMsg(error, 'Failed to save client'));
    }
  };

  const handleDelete = async (record: ClientRecord) => {
    try {
      await HrmProjectService.deleteClient(organizationId, record.id ?? '', user);
      message.success('Client deleted');
      loadClients();
    } catch (error: any) {
      message.error(extractClientErrorMsg(error, 'Delete failed'));
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120, sorter: (a: ClientRecord, b: ClientRecord) => (a.code || '').localeCompare(b.code || '') },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: ClientRecord, b: ClientRecord) => (a.name || '').localeCompare(b.name || '') },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: unknown, record: ClientRecord) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Can I="edit"><Button size="small" onClick={() => openEdit(record)}>Edit</Button></Can>
          <Can I="delete">
            <Popconfirm title="Delete this client?" onConfirm={() => handleDelete(record)}>
              <Button size="small" danger>Delete</Button>
            </Popconfirm>
          </Can>
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
      extra={<Can I="add"><Button type="primary" size="small" icon={<PlusOutlined />} onClick={openNew}>New Client</Button></Can>}
    >
      <Table
        dataSource={clients}
        columns={columns}
        rowKey={(r) => r.id ?? r.code}
        loading={loading}
        size="small"
        pagination={false}
        scroll={{ x: 'max-content', y: 'calc(100vh - 180px)' }}
        sticky
        locale={{ emptyText: <Empty description="No clients found" /> }}
      />
      <Modal
        title={editingClient ? 'Edit Client' : 'New Client'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        destroyOnHidden
        maskClosable={false}
        footer={[
          <Button key="cancel" onClick={() => setFormOpen(false)}>Cancel</Button>,
          <Can key="save" I={editingClient ? 'edit' : 'add'}>
            <Button type="primary" onClick={handleSave}>OK</Button>
          </Can>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input disabled={!!editingClient} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
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
    setActiveDetailTab,
    setOverviewEditing,
    isAllocationFormOpen,
    allocationPrefill,
    closeAllocationForm,
    isClientDrawerOpen,
    openClientDrawer,
    closeClientDrawer,
    selectedProject,
    projects,
    loadingProjects,
    filterBU,
    filterType,
    filterStatus,
    filterClient,
    searchQuery,
    setSelectedProject,
  } = useHrmProjectStore();
  const { loadProjects, loadProjectDetail } = useProjectData();
  // Only the project's own manager may edit it — the same rule the server enforces
  // (PRJ_038). A module-wide edit grant does not open somebody else's project.
  const { employeeCode } = useEmployeeIdentity();
  const isProjectManager = isSameEmployee(employeeCode, selectedProject?.projectManagerId);
  const perms = useProjectPermissions();

  // Load projects on mount and when filters change
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBU, filterType, filterStatus]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (searchQuery && !p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !p.projectCode.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterType && p.projectType !== filterType) return false;
      if (filterClient && p.clientName !== filterClient) return false;
      return true;
    });
  }, [projects, searchQuery, filterStatus, filterType, filterClient]);

  const handleSelectProject = (project: typeof projects[number]) => {
    setSelectedProject(project);
    loadProjectDetail(project.handle);
  };

  const tabItems = [
    perms.canAccessProjects && {
      key: 'projects',
      label: 'Projects',
      children: (
        <ProjectTable
          projects={filteredProjects}
          loading={loadingProjects}
          onView={handleSelectProject}
        />
      ),
    },
    perms.canAccessReports && {
      key: 'reports',
      label: 'Reports',
      children: (
        <div style={{ padding: 16 }}>
          <ProjectReportPanel />
        </div>
      ),
    },
  ].filter(Boolean) as { key: string; label: React.ReactNode; children: React.ReactNode }[];

  // If the active tab was gated away (or none selected yet), fall back to the
  // first visible tab so the panel never renders blank.
  const visibleKeys = tabItems.map((t) => t.key);
  const resolvedActiveTab =
    activeTab && visibleKeys.includes(activeTab) ? activeTab : visibleKeys[0];

  return (
    <ModuleAccessGate moduleCode="HRM_PROJECT" appTitle="Projects & Resource Allocation">
    <div className={`hrm-module-root ${styles.hrmProjectLanding}`}>
      <CommonAppBar appTitle="Projects & Resource Allocation" />
      <div className={styles.content}>
        {selectedProject ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderBottom: '1px solid #e8e8e8' }}>
              <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => setSelectedProject(null)}>
                Back to projects
              </Button>
              <span style={{ fontWeight: 600 }}>
                {selectedProject.projectCode} — {selectedProject.projectName}
              </span>
              <ProjectStatusBadge status={selectedProject.status} />
              {isProjectManager && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => { setActiveDetailTab('overview'); setOverviewEditing(true); }}
                  style={{ marginLeft: 'auto' }}
                >
                  Edit
                </Button>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <ProjectDetailPanel />
            </div>
          </div>
        ) : (
          <Tabs
            className={styles.mainTabs}
            activeKey={resolvedActiveTab}
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
        )}
      </div>

      <Modal
        title={selectedProject ? `Edit — ${selectedProject.projectCode}` : 'New Project'}
        open={isProjectFormOpen}
        onCancel={closeProjectForm}
        footer={null}
        width={720}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <ProjectForm />
      </Modal>

      <Modal
        title={allocationPrefill ? 'Assign Task To Resource' : 'Add Resource Allocation'}
        open={isAllocationFormOpen}
        onCancel={closeAllocationForm}
        footer={null}
        width={640}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        {selectedProject && <AllocationForm projectHandle={selectedProject.handle} />}
      </Modal>

      <ClientManagementDrawer open={isClientDrawerOpen} onClose={closeClientDrawer} />
    </div>
    </ModuleAccessGate>
  );
}
