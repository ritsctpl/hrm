'use client';
import React, { useEffect, useState } from 'react';
import {
  Descriptions, Progress, Card, Button, Dropdown, Tag, Space,
  Form, Input, Select, InputNumber, DatePicker, Radio, message,
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { Project, ProjectStatus } from '../../types/domain.types';
import type { ClientResponse } from '../../types/api.types';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useProjectMutations } from '../../hooks/useProjectMutations';
import { useHrmProjectStore } from '../../stores/hrmProjectStore';
import { useEmployeeIdentity } from '@/modules/hrmAccess/hooks/useEmployeeIdentity';
import { HrmProjectService } from '../../services/hrmProjectService';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';
import type { BusinessUnit, Department } from '@/modules/hrmOrganization/types/domain.types';
import HrmEmployeePicker from '@/components/hrm/molecules/HrmEmployeePicker';
import { formatDate } from '../../utils/projectHelpers';
import { ALLOCATION_OVER_THRESHOLD_PCT, CURRENCY_OPTIONS, PROJECT_TYPES } from '../../utils/projectConstants';
import ProjectStatusBadge from '../atoms/ProjectStatusBadge';
import ChangeManagerModal from './ChangeManagerModal';
import styles from '../../styles/ProjectDetail.module.css';

const TYPE_LABELS: Record<string, string> = {
  BILLABLE: 'Billable', NON_BILLABLE: 'Non-Billable', REVENUE_GENERATION: 'Revenue Generation',
};

const STATUS_LABELS: Record<string, string> = {
  INITIATED: 'Initiated', DRAFT: 'Draft', IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

interface ProjectOverviewTabProps {
  project: Project;
}

const STATUS_TRANSITIONS: Record<string, ProjectStatus[]> = {
  INITIATED: ['DRAFT', 'CANCELLED'],
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  // Re-open: a wrongly closed project can be brought back.
  COMPLETED: ['IN_PROGRESS'],
  CANCELLED: ['DRAFT'],
};

// Terminal states get a "Re-open" label instead of "Move to next stage".
const TERMINAL_STATUSES = new Set<string>(['COMPLETED', 'CANCELLED']);

interface EditForm {
  projectType: Project['projectType'];
  baseProjectHandle?: string;
  clientName?: string;
  clientId?: string;
  currency?: string;
  buCode: string;
  departmentCode?: string;
  projectManagerId: string;
  estimateHours: number;
  startDate?: Dayjs;
  endDate?: Dayjs;
  description?: string;
}

const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ project }) => {
  const { updateProjectStatus, updateProject } = useProjectMutations();
  const { employeeCode } = useEmployeeIdentity();
  const { isOverviewEditing, setOverviewEditing, projects, savingProject } = useHrmProjectStore();
  const [changeManagerOpen, setChangeManagerOpen] = useState(false);
  const [form] = Form.useForm<EditForm>();

  // Reference data (loaded lazily when editing starts)
  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [loadingRef, setLoadingRef] = useState(false);
  const watchBuCode = Form.useWatch('buCode', form);
  const watchPm = Form.useWatch('projectManagerId', form);

  const estimate = project.estimateHours || 0;
  const committed = project.committedWorkHours ?? project.totalAllocatedHours ?? 0;
  const actual = project.totalActualHours || 0;
  const remaining = Math.max(estimate - actual, 0);
  const actualPct = estimate > 0 ? Math.round((actual / estimate) * 100) : 0;
  const allowed = estimate * (ALLOCATION_OVER_THRESHOLD_PCT / 100);
  const overCommitted = estimate > 0 && committed > allowed;

  const isPM = !!employeeCode && employeeCode === project.projectManagerId;
  const nextStages = STATUS_TRANSITIONS[project.status] ?? [];

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    const user = parseCookies().rl_user_id ?? parseCookies().user ?? '';
    await updateProjectStatus(project.handle, newStatus, '', user);
  };

  // Load reference data + seed the form whenever edit mode opens for this project.
  useEffect(() => {
    if (!isOverviewEditing) return;
    form.setFieldsValue({
      projectType: project.projectType,
      baseProjectHandle: project.baseProjectHandle,
      clientName: project.clientName,
      clientId: project.clientId,
      currency: project.currency,
      buCode: project.buCode,
      departmentCode: project.departmentCode,
      projectManagerId: project.projectManagerId,
      estimateHours: project.estimateHours,
      startDate: project.startDate ? dayjs(project.startDate) : undefined,
      endDate: project.endDate ? dayjs(project.endDate) : undefined,
      description: project.description,
    });
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoadingRef(true);
    Promise.allSettled([
      HrmEmployeeService.fetchDirectory({ organizationId, isActive: true, size: 500 }),
      HrmOrganizationService.fetchBusinessUnitsBySite(organizationId),
      HrmProjectService.listClients(organizationId),
    ]).then(([emp, bu, cl]) => {
      if (emp.status === 'fulfilled') setEmployees(emp.value?.employees ?? []);
      if (bu.status === 'fulfilled') setBusinessUnits(bu.value ?? []);
      if (cl.status === 'fulfilled') setClients(cl.value ?? []);
    }).finally(() => setLoadingRef(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverviewEditing, project.handle]);

  // Departments depend on the selected BU.
  useEffect(() => {
    if (!isOverviewEditing) return;
    const organizationId = getOrganizationId();
    const bu = businessUnits.find((b) => b.buCode === watchBuCode);
    if (!organizationId || !bu?.handle) { setDepartments([]); return; }
    HrmOrganizationService.fetchDepartments(organizationId, bu.handle)
      .then((data) => setDepartments(data ?? []))
      .catch(() => setDepartments([]));
  }, [watchBuCode, businessUnits, isOverviewEditing]);

  const handleSave = async () => {
    const v = await form.validateFields();
    if (v.startDate && v.endDate && v.endDate.isBefore(v.startDate, 'day')) {
      message.error('End date cannot be before start date');
      return;
    }
    const user = parseCookies().rl_user_id ?? parseCookies().user ?? 'system';
    await updateProject(project.handle, {
      projectName: project.projectName, // locked — sent unchanged
      projectType: v.projectType,
      baseProjectHandle: v.baseProjectHandle,
      clientName: v.clientName,
      clientId: v.clientId,
      currency: v.currency,
      buCode: v.buCode,
      departmentCode: v.departmentCode,
      projectManagerId: v.projectManagerId,
      estimateHours: v.estimateHours,
      startDate: v.startDate ? v.startDate.format('YYYY-MM-DD') : '',
      endDate: v.endDate ? v.endDate.format('YYYY-MM-DD') : '',
      description: v.description,
    }, user);
    setOverviewEditing(false);
  };

  return (
    <div className={styles.overviewGrid}>
      <Card
        size="small"
        title="Project Identity"
        extra={isOverviewEditing && (
          <Space>
            <Button size="small" onClick={() => setOverviewEditing(false)}>Cancel</Button>
            <Button size="small" type="primary" loading={savingProject} onClick={handleSave}>Save</Button>
          </Space>
        )}
      >
        {!isOverviewEditing ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Code">{project.projectCode}</Descriptions.Item>
            <Descriptions.Item label="Name">{project.projectName}</Descriptions.Item>
            <Descriptions.Item label="Status"><ProjectStatusBadge status={project.status} /></Descriptions.Item>
            <Descriptions.Item label="Type">{TYPE_LABELS[project.projectType] ?? project.projectType}</Descriptions.Item>
            <Descriptions.Item label="BU">{project.buCode}</Descriptions.Item>
            {project.departmentCode && <Descriptions.Item label="Department">{project.departmentCode}</Descriptions.Item>}
            {project.clientName && <Descriptions.Item label="Client">{project.clientName}</Descriptions.Item>}
            {project.currency && <Descriptions.Item label="Currency">{project.currency}</Descriptions.Item>}
            <Descriptions.Item label="PM">{project.projectManagerName}</Descriptions.Item>
            <Descriptions.Item label="Start">{formatDate(project.startDate)}</Descriptions.Item>
            <Descriptions.Item label="End">{formatDate(project.endDate)}</Descriptions.Item>
            {project.description && <Descriptions.Item label="Description">{project.description}</Descriptions.Item>}
          </Descriptions>
        ) : (
          <Form form={form} layout="vertical" size="small">
            <Form.Item label="Code">
              <Input value={project.projectCode} disabled />
            </Form.Item>
            <Form.Item label="Name" extra="Project name cannot be changed">
              <Input value={project.projectName} disabled />
            </Form.Item>
            <Form.Item name="projectType" label="Type" rules={[{ required: true }]}>
              <Radio.Group>
                {PROJECT_TYPES.map((t) => <Radio key={t.value} value={t.value}>{t.label}</Radio>)}
              </Radio.Group>
            </Form.Item>
            <Form.Item name="buCode" label="Business Unit" rules={[{ required: true }]}>
              <Select
                placeholder="Select Business Unit" showSearch allowClear loading={loadingRef}
                filterOption={(i, o) => String(o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                options={businessUnits.map((bu) => ({ value: bu.buCode, label: `${bu.buCode} - ${bu.buName}` }))}
                onChange={() => form.setFieldValue('departmentCode', undefined)}
              />
            </Form.Item>
            <Form.Item name="departmentCode" label="Department">
              <Select
                placeholder={watchBuCode ? 'Select Department' : 'Select BU first'} showSearch allowClear disabled={!watchBuCode}
                filterOption={(i, o) => String(o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                options={departments.map((d) => ({ value: d.deptCode, label: `${d.deptCode} - ${d.deptName}` }))}
              />
            </Form.Item>
            <Form.Item name="clientName" label="Client">
              <Select
                placeholder="Select client" showSearch allowClear loading={loadingRef}
                filterOption={(i, o) => String(o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                options={clients.map((c) => ({ value: c.name, label: `${c.code} - ${c.name}` }))}
                onChange={(name) => {
                  const picked = clients.find((c) => c.name === name);
                  form.setFieldValue('clientId', picked?.id ?? picked?.handle ?? picked?.code ?? undefined);
                }}
              />
            </Form.Item>
            <Form.Item name="clientId" hidden><Input /></Form.Item>
            <Form.Item name="currency" label="Currency">
              <Select
                placeholder="Select currency" showSearch allowClear
                filterOption={(i, o) => String(o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                options={CURRENCY_OPTIONS}
              />
            </Form.Item>
            <Form.Item name="projectManagerId" label="Project Manager" rules={[{ required: true }]}>
              <HrmEmployeePicker
                value={watchPm}
                loading={loadingRef}
                placeholder="Search project manager..."
                options={employees.map((e) => ({ handle: e.employeeCode, name: e.fullName, employeeCode: e.employeeCode }))}
                onSelect={(emp) => form.setFieldValue('projectManagerId', emp.employeeCode)}
              />
            </Form.Item>
            <Form.Item name="baseProjectHandle" label="Base Project">
              <Select
                placeholder="Link existing project (optional)" showSearch allowClear
                filterOption={(i, o) => String(o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                options={projects.filter((p) => p.handle !== project.handle).map((p) => ({ value: p.handle, label: `${p.projectCode} - ${p.projectName}` }))}
              />
            </Form.Item>
            <Form.Item name="estimateHours" label="Estimate Hours" rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
            <Space style={{ display: 'flex' }}>
              <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} disabledDate={(d) => !!form.getFieldValue('startDate') && d.isBefore(form.getFieldValue('startDate'), 'day')} />
              </Form.Item>
            </Space>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </Card>

      <div>
        <Card size="small" title="Effort & Progress" className={styles.progressCard} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Estimated</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{estimate} h</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Actual (timesheet)</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{actual} h</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Remaining</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: remaining === 0 && estimate > 0 ? '#ff4d4f' : undefined }}>{remaining} h</div>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#595959', marginBottom: 2 }}>
              <span>Progress — actual vs estimate</span><span>{actual} h / {estimate} h · {actualPct}%</span>
            </div>
            <Progress
              percent={Math.min(actualPct, 100)}
              size="small"
              showInfo={false}
              strokeColor={actualPct > 100 ? '#ff4d4f' : '#52c41a'}
            />
          </div>

          <div style={{ fontSize: 12, color: '#595959' }}>
            Committed work: <strong>{committed} h</strong> of {estimate} h
            {overCommitted && (
              <Tag color="red" style={{ marginLeft: 8 }}>exceeds {ALLOCATION_OVER_THRESHOLD_PCT}% ({allowed.toFixed(0)} h allowed)</Tag>
            )}
          </div>
        </Card>

        {isPM && (
          <Card size="small" title="Project Actions">
            <Space wrap>
              {nextStages.length > 0 && (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: nextStages.map((s) => ({ key: s, label: STATUS_LABELS[s] ?? s, danger: s === 'CANCELLED' })),
                    onClick: ({ key }) => handleStatusChange(key as ProjectStatus),
                  }}
                >
                  <Button size="small">
                    {TERMINAL_STATUSES.has(project.status) ? 'Re-open' : 'Move to next stage'} <DownOutlined />
                  </Button>
                </Dropdown>
              )}
              <Button size="small" onClick={() => setChangeManagerOpen(true)}>Change Manager</Button>
            </Space>
          </Card>
        )}
      </div>

      <ChangeManagerModal open={changeManagerOpen} project={project} onClose={() => setChangeManagerOpen(false)} />
    </div>
  );
};

export default ProjectOverviewTab;
